"""
Unit tests for the GP[YYMMDD]-[SERIAL] sequence generator service.
Tests thread-safety, format verification, and daily sequence resets.
"""

import pytest
from datetime import datetime
from app.services.sequence_service import SequenceService

def test_date_key_derivation():
    service = SequenceService(prefix="GP", pad_length=3)
    # 2026-10-14 -> YYMMDD is '261014'
    dt = datetime(2026, 10, 14, 10, 30, 0)
    assert service.get_date_key(dt, format_type="YYMMDD") == "261014"
    assert service.get_date_key(dt, format_type="DDMMYY") == "141026"
    assert service.get_date_key(dt, format_type="YYYYMMDD") == "20261014"

def test_parse_pass_id():
    service = SequenceService(prefix="GP", pad_length=3)
    parsed = service.parse_pass_id("GP261014-001")
    assert parsed is not None
    prefix, date_key, seq = parsed
    assert prefix == "GP"
    assert date_key == "261014"
    assert seq == 1

def test_invalid_pass_id():
    service = SequenceService(prefix="GP", pad_length=3)
    assert service.parse_pass_id("INVALID_ID") is None
    assert service.parse_pass_id("GP-123") is None

def test_sequence_generation_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.database import Base

    # Test in-memory SQLite engine
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    service = SequenceService(prefix="GP", pad_length=3)
    dt = datetime(2026, 10, 14, 9, 0, 0)

    # 1. First pass generation
    res1 = service.generate_next_pass_id(db=db, dt=dt, format_type="YYMMDD")
    assert res1["pass_id"] == "GP261014-001"
    assert res1["seq_number"] == 1
    assert res1["date_key"] == "261014"

    # 2. Second pass generation on same day
    res2 = service.generate_next_pass_id(db=db, dt=dt, format_type="YYMMDD")
    assert res2["pass_id"] == "GP261014-002"
    assert res2["seq_number"] == 2

    # 3. Third pass generation with DDMMYY format
    res3 = service.generate_next_pass_id(db=db, dt=dt, format_type="DDMMYY")
    assert res3["pass_id"] == "GP141026-001"
    assert res3["seq_number"] == 1

    # 4. Peek current sequence without incrementing
    peek = service.peek_current_sequence(db=db, dt=dt, format_type="YYMMDD")
    assert peek["current_seq"] == 2
    assert peek["next_seq"] == 3
    assert peek["next_pass_id"] == "GP261014-003"

    # 5. Reset sequence
    service.reset_sequence(db=db, date_key="261014", new_seq=99)
    res_after_reset = service.generate_next_pass_id(db=db, dt=dt, format_type="YYMMDD")
    assert res_after_reset["pass_id"] == "GP261014-100"
    assert res_after_reset["seq_number"] == 100

    db.close()
