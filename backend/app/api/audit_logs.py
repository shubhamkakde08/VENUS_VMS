import csv
import io
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuditLog

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs Compliance"])

class AuditExportRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    actor: Optional[str] = None
    action: Optional[str] = None
    search: Optional[str] = None
    records: Optional[List[dict]] = None

def generate_csv_buffer(records: list) -> io.StringIO:
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    # Compliance CSV Header
    writer.writerow([
        "Record ID",
        "Timestamp (UTC)",
        "Actor Username / Email",
        "Actor Name",
        "Role",
        "Action Executed",
        "Target Entity",
        "Entity Identifier",
        "Compliance Severity",
        "Source IP Address",
        "Audit Details & Metadata"
    ])
    
    for r in records:
        writer.writerow([
            r.get("id", ""),
            r.get("timestamp", ""),
            r.get("actor_username", r.get("actor_email", "")),
            r.get("actor_name", r.get("actor_username", "")),
            r.get("actor_role", r.get("role", "SECURITY")),
            r.get("action", ""),
            r.get("entity_name", ""),
            r.get("entity_id", ""),
            r.get("severity", "INFO"),
            r.get("ip_address", "127.0.0.1"),
            r.get("details", "")
        ])
    
    output.seek(0)
    return output

@router.get("/export-csv")
def export_audit_logs_csv_get(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD or ISO)"),
    actor: Optional[str] = Query(None, description="Filter by actor"),
    action: Optional[str] = Query(None, description="Filter by action"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Session = Depends(get_db)
):
    """
    Exports filtered audit records as an RFC 4180 compliant CSV file for statutory and compliance reporting.
    Filters records by start_date and end_date.
    """
    try:
        query = db.query(AuditLog)
        
        if start_date:
            try:
                s_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                query = query.filter(AuditLog.timestamp >= s_dt)
            except Exception:
                try:
                    s_d = datetime.strptime(start_date[:10], "%Y-%m-%d")
                    query = query.filter(AuditLog.timestamp >= s_d)
                except Exception:
                    pass
                    
        if end_date:
            try:
                e_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                query = query.filter(AuditLog.timestamp <= e_dt)
            except Exception:
                try:
                    e_d = datetime.strptime(end_date[:10], "%Y-%m-%d")
                    # Include the entire day until 23:59:59
                    query = query.filter(AuditLog.timestamp <= datetime.combine(e_d.date(), datetime.max.time()))
                except Exception:
                    pass

        if actor and actor != "ALL":
            query = query.filter(AuditLog.actor_email.ilike(f"%{actor}%"))

        if action and action != "ALL":
            query = query.filter(AuditLog.action == action)

        logs = query.order_by(AuditLog.timestamp.desc()).all()
        
        records = []
        for l in logs:
            records.append({
                "id": str(l.id),
                "timestamp": l.timestamp.isoformat() if l.timestamp else "",
                "actor_username": l.actor_email or "SYSTEM",
                "actor_name": l.actor_email or "SYSTEM",
                "actor_role": "ADMIN",
                "action": l.action,
                "entity_name": l.entity_name,
                "entity_id": l.entity_id,
                "severity": "INFO",
                "ip_address": l.ip_address or "127.0.0.1",
                "details": str(l.after_state or "")
            })

        csv_buffer = generate_csv_buffer(records)
        filename = f"Venus_VMS_Audit_Report_{start_date or 'ALL'}_to_{end_date or 'ALL'}.csv"
        
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CSV export: {str(e)}"
        )

@router.post("/export-csv")
def export_audit_logs_csv_post(payload: AuditExportRequest):
    """
    Server-side CSV export endpoint accepting filter criteria and optional payload records.
    Filters records by date range and streams downloadable compliance CSV.
    """
    records = payload.records or []
    
    # Filter by date range if records provided
    filtered_records = []
    for r in records:
        ts_str = r.get("timestamp", "")
        if payload.start_date:
            if ts_str < payload.start_date:
                continue
        if payload.end_date:
            # allow end_date as YYYY-MM-DD to include that whole date
            end_bound = payload.end_date if len(payload.end_date) > 10 else f"{payload.end_date}T23:59:59.999Z"
            if ts_str > end_bound:
                continue
        if payload.actor and payload.actor != "ALL":
            actor_val = (r.get("actor_username", "") + " " + r.get("actor_role", "")).lower()
            if payload.actor.lower() not in actor_val:
                continue
        if payload.action and payload.action != "ALL":
            if r.get("action") != payload.action:
                continue
        if payload.search:
            s_low = payload.search.lower()
            blob = (
                str(r.get("details", "")) + " " +
                str(r.get("entity_id", "")) + " " +
                str(r.get("ip_address", "")) + " " +
                str(r.get("actor_username", ""))
            ).lower()
            if s_low not in blob:
                continue
        filtered_records.append(r)
        
    csv_buffer = generate_csv_buffer(filtered_records)
    filename = f"Venus_VMS_Audit_Compliance_{payload.start_date or 'start'}_to_{payload.end_date or 'end'}.csv"
    
    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
