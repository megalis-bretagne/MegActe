from fastapi import APIRouter

router = APIRouter()


@router.get("/users", tags=["users"])
def get_users():
    return [{"username": "sylvain"}, {"username": "Jolivet"}]
