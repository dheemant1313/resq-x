import logging
import socket
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("resqx.database")

def check_tcp_port(host: str, port: int, timeout: float = 0.5) -> bool:
    """Fast non-blocking TCP socket check to verify database port responsiveness."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        # Parse host and port
        parsed = urlparse(db_url)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 5432

        # Fast socket probe if local host
        if host in ("localhost", "127.0.0.1"):
            is_listening = check_tcp_port("127.0.0.1", port, timeout=0.5)
            if not is_listening:
                if settings.USE_SQLITE_FALLBACK:
                    fallback_url = "sqlite:///./resqx_local.db"
                    logger.warning(
                        f"PostgreSQL server not detected at {host}:{port}. "
                        f"Auto-falling back to persistent local SQLite database ({fallback_url})."
                    )
                    return create_engine(
                        fallback_url,
                        connect_args={"check_same_thread": False}
                    )
                raise ConnectionError(f"PostgreSQL server is not reachable at {host}:{port}")

        try:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            with engine.connect() as conn:
                logger.info("Successfully established connection with PostgreSQL database.")
            return engine
        except Exception as e:
            if settings.USE_SQLITE_FALLBACK:
                fallback_url = "sqlite:///./resqx_local.db"
                logger.warning(
                    f"PostgreSQL connection to {db_url} failed ({e}). "
                    f"Falling back to local SQLite ({fallback_url})."
                )
                return create_engine(
                    fallback_url,
                    connect_args={"check_same_thread": False}
                )
            raise e
    else:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
