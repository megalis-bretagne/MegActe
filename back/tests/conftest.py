import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class TestDatabase(unittest.TestCase):
    """Class principal pour load la BDD et rollback à chaque test"""

    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self._sessionLocal = TestingSessionLocal
        self.session = self._sessionLocal(bind=self.connection)

    def tearDown(self):
        self.session.close()
        self.transaction.rollback()
        self.connection.close()
