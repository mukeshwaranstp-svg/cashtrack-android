"""GET/PUT /api/sync — the cross-device state bundle endpoint."""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SyncBundle
from app.state import assemble_bundle, apply_bundle

router = APIRouter()


@router.get("/api/sync", response_model=SyncBundle)
def get_sync(db: Session = Depends(get_db)):
    return assemble_bundle(db)


@router.put("/api/sync", response_model=SyncBundle)
def put_sync(bundle: SyncBundle, db: Session = Depends(get_db)):
    return apply_bundle(db, bundle)


# POST alias — browsers use navigator.sendBeacon (POST-only) for page-unload
# flushing. sendBeacon always sends Content-Type: text/plain and cannot set a
# custom header, so we read the raw body and parse JSON ourselves.
@router.post("/api/sync", response_model=SyncBundle)
async def post_sync(request: Request, db: Session = Depends(get_db)):
    try:
        bundle = SyncBundle.model_validate_json((await request.body()).decode())
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid sync bundle: {exc}")
    return apply_bundle(db, bundle)
