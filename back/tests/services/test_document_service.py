from unittest.mock import MagicMock
import pytest
from app.services.document_service import DocumentService
from app.exceptions.custom_exceptions import EntiteIdException
from . import FluxActionServiceMock
from ..conftest import TestDatabase


class TestDocumentService(TestDatabase):
    """Test du service document_service"""

    def setUp(self):
        super().setUp()
        self.client_api = MagicMock()

    def test_sould_raise_error_when_list_document_bad_id_e(self):
        # Assert id_e is None
        with pytest.raises(EntiteIdException):
            DocumentService(self.client_api, FluxActionServiceMock()).list_documents_paginate(None)

        # Assert id_e < 0
        with pytest.raises(EntiteIdException):
            DocumentService(self.client_api, FluxActionServiceMock()).list_documents_paginate(-1)

    def test_sould_list_document_with_no_param(self):
        # GIVEN
        id_e = 1

        # DO
        DocumentService(self.client_api, FluxActionServiceMock()).list_documents_paginate(id_e)

        # ASSERT
        self.client_api.perform_get.assert_called_once()
        called_url = self.client_api.perform_get.call_args[0][0]

        assert f"entite/{id_e}/document" in called_url
        assert self.client_api.perform_get.call_args[1]["query_params"] == {
            "offset": 0,
            "limit": 100,
        }

    def test_sould_list_document_with_query(self):
        # GIVEN
        id_e = 1
        flux = "id_flux"
        offset = 1
        limit = 10

        # DO
        DocumentService(self.client_api, FluxActionServiceMock()).list_documents_paginate(
            id_e, type=flux, offset=offset, limit=limit
        )

        # ASSERT
        self.client_api.perform_get.assert_called_once()
        called_url = self.client_api.perform_get.call_args[0][0]

        assert f"entite/{id_e}/document" in called_url
        assert self.client_api.perform_get.call_args[1]["query_params"] == {
            "type": flux,
            "offset": offset,
            "limit": limit,
        }
