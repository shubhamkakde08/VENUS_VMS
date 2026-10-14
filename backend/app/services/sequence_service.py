"""
VISITFLOW / VENUS PIPES & TUBES - GATE PASS ID SEQUENCE SERVICE
Implements atomic, concurrency-safe GP[YYMMDD]-[SERIAL] generation using
database row-level locking (SELECT ... FOR UPDATE) and incrementing table counter.
"""

from datetime import datetime, timezone
import re
from typing import Optional, Tuple, Dict, Any
try:
    from sqlalchemy.orm import Session
    from sqlalchemy import text
    from app.models.models import DailyPassCounter
except ImportError:
    Session = Any  # type: ignore
    DailyPassCounter = None  # type: ignore

class SequenceService:
    def __init__(self, prefix: str = "GP", pad_length: int = 3):
        self.prefix = prefix
        self.pad_length = pad_length

    @staticmethod
    def get_date_key(dt: Optional[datetime] = None, format_type: str = "YYMMDD") -> str:
        """
        Derives the date key string for the counter.
        - YYMMDD (Default requested): e.g. 2026-10-14 -> '261014'
        - DDMMYY: e.g. 2026-10-14 -> '141026'
        """
        if dt is None:
            dt = datetime.now()

        if format_type.upper() == "DDMMYY":
            return dt.strftime("%d%m%y")
        elif format_type.upper() == "YYYYMMDD":
            return dt.strftime("%Y%m%d")
        else: # Default YYMMDD
            return dt.strftime("%y%m%d")

    def generate_next_pass_id(
        self,
        db: Session,
        dt: Optional[datetime] = None,
        format_type: str = "YYMMDD",
        custom_prefix: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Atomically increments the database counter for the specified date key
        using a pessimistic row-level lock (FOR UPDATE) or atomic upsert.
        
        Returns:
            {
                "pass_id": "GP261014-001",
                "prefix": "GP",
                "date_key": "261014",
                "seq_number": 1,
                "pad_length": 3
            }
        """
        pref = custom_prefix or self.prefix
        date_key = self.get_date_key(dt=dt, format_type=format_type)

        try:
            # Atomic lock query: SELECT ... FOR UPDATE
            counter = db.query(DailyPassCounter).filter(
                DailyPassCounter.date_key == date_key
            ).with_for_update().first()

            if counter is None:
                # First pass of the day: initialize sequence to 1
                counter = DailyPassCounter(date_key=date_key, last_seq=1)
                db.add(counter)
                db.flush()
                next_seq = 1
            else:
                counter.last_seq += 1
                db.flush()
                next_seq = counter.last_seq

            # Construct GP[YYMMDD]-[SERIAL]
            padded_seq = str(next_seq).zfill(self.pad_length)
            generated_id = f"{pref}{date_key}-{padded_seq}"

            db.commit()

            return {
                "pass_id": generated_id,
                "prefix": pref,
                "date_key": date_key,
                "seq_number": next_seq,
                "pad_length": self.pad_length,
                "format": f"{pref}[{format_type}]-[{ '0' * self.pad_length }]"
            }

        except Exception as ex:
            db.rollback()
            raise RuntimeError(f"Database sequence generation error: {str(ex)}") from ex

    def peek_current_sequence(
        self,
        db: Session,
        dt: Optional[datetime] = None,
        format_type: str = "YYMMDD",
        custom_prefix: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Inspects the current counter value without incrementing.
        """
        pref = custom_prefix or self.prefix
        date_key = self.get_date_key(dt=dt, format_type=format_type)

        counter = db.query(DailyPassCounter).filter(
            DailyPassCounter.date_key == date_key
        ).first()

        current_seq = counter.last_seq if counter else 0
        next_seq = current_seq + 1
        padded_next = str(next_seq).zfill(self.pad_length)

        return {
            "current_seq": current_seq,
            "next_seq": next_seq,
            "date_key": date_key,
            "next_pass_id": f"{pref}{date_key}-{padded_next}",
            "prefix": pref
        }

    def reset_sequence(
        self,
        db: Session,
        date_key: Optional[str] = None,
        new_seq: int = 0
    ) -> bool:
        """
        Admin override to reset or calibrate the sequence counter.
        """
        if date_key is None:
            date_key = self.get_date_key()

        counter = db.query(DailyPassCounter).filter(
            DailyPassCounter.date_key == date_key
        ).with_for_update().first()

        if counter:
            counter.last_seq = new_seq
        else:
            counter = DailyPassCounter(date_key=date_key, last_seq=new_seq)
            db.add(counter)

        db.commit()
        return True

    @staticmethod
    def parse_pass_id(pass_id: str) -> Optional[Tuple[str, str, int]]:
        """
        Validates and parses a pass ID:
        Example: 'GP261014-001' -> ('GP', '261014', 1)
        """
        pattern = r"^([A-Z]{2,4})(\d{6,8})-(\d+)$"
        match = re.match(pattern, pass_id.strip().upper())
        if not match:
            return None
        prefix, date_part, seq_str = match.groups()
        return prefix, date_part, int(seq_str)

# Singleton service instance
sequence_service = SequenceService(prefix="GP", pad_length=3)
