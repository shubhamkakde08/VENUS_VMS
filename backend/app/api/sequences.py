from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.sequence_service import sequence_service
from app.schemas.schemas import (
    GeneratePassIdRequest,
    GeneratedPassIdResponse,
    ValidatePassIdRequest,
    ValidatePassIdResponse
)

router = APIRouter(prefix="/sequences", tags=["Pass Sequences"])

@router.post("/generate-pass-id", response_model=GeneratedPassIdResponse)
def generate_pass_id(
    payload: GeneratePassIdRequest = GeneratePassIdRequest(),
    db: Session = Depends(get_db)
):
    """
    Atomically generates the next GP[YYMMDD]-[SERIAL] visitor pass ID
    using row-level locking on the MySQL daily_pass_counters table.
    """
    try:
        result = sequence_service.generate_next_pass_id(
            db=db,
            format_type=payload.format_type,
            custom_prefix=payload.custom_prefix
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate sequential pass ID: {str(e)}"
        )

@router.get("/peek-current")
def peek_current_sequence(
    format_type: str = "YYMMDD",
    prefix: str = "GP",
    db: Session = Depends(get_db)
):
    """
    Inspects the current sequence counter for today without incrementing it.
    """
    return sequence_service.peek_current_sequence(
        db=db,
        format_type=format_type,
        custom_prefix=prefix
    )

@router.post("/validate-pass-id", response_model=ValidatePassIdResponse)
def validate_pass_id(payload: ValidatePassIdRequest):
    """
    Parses and checks if a given pass ID matches the GP[YYMMDD]-[SERIAL] specification.
    """
    parsed = sequence_service.parse_pass_id(payload.pass_id)
    if not parsed:
        return ValidatePassIdResponse(
            is_valid=False,
            error=f"Invalid format: '{payload.pass_id}' does not match GP[YYMMDD]-[SERIAL] pattern."
        )
    
    prefix, date_key, seq_num = parsed
    return ValidatePassIdResponse(
        is_valid=True,
        prefix=prefix,
        date_key=date_key,
        seq_number=seq_num
    )

@router.post("/reset")
def reset_daily_sequence(
    date_key: str,
    new_seq: int = 0,
    db: Session = Depends(get_db)
):
    """
    Admin override: resets the counter for a given date_key.
    """
    success = sequence_service.reset_sequence(db=db, date_key=date_key, new_seq=new_seq)
    return {"status": "SUCCESS", "date_key": date_key, "new_seq": new_seq}
