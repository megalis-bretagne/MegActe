import logging
from functools import wraps

logger = logging.getLogger()


def log_exceptions(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Exception raised in {func.__name__}. exception: {str(e)}")
            raise e

    return wrapper
