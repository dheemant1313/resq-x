import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    UserRole
)

def test_password_hashing_and_verification():
    raw_password = "SecureDisasterReliefKey2026!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False

def test_jwt_token_creation_and_decoding():
    user_id = 42
    role = UserRole.OPERATOR.value
    center_id = None

    token = create_access_token(subject=user_id, role=role, center_id=center_id)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "OPERATOR"
    assert payload["center_id"] is None
    assert "exp" in payload

def test_relief_center_token_payload():
    user_id = 99
    role = UserRole.RELIEF_CENTER.value
    center_id = 7

    token = create_access_token(subject=user_id, role=role, center_id=center_id)
    payload = decode_access_token(token)
    assert payload["sub"] == "99"
    assert payload["role"] == "RELIEF_CENTER"
    assert payload["center_id"] == 7
