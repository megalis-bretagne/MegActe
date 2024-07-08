from ..conftest import engine
from app.models.users import Base


def setUpModule():
    Base.metadata.create_all(bind=engine)


def tearDownModule():
    Base.metadata.drop_all(bind=engine)
