from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.experiment import Experiment
from app.schemas.experiment import ExperimentOut, ExperimentCreate

router = APIRouter()


@router.get("/", response_model=List[ExperimentOut])
def list_experiments(subject: str = None, db: Session = Depends(get_db)):
    """
    List curated experiments, optionally filtered by subject (physics, chemistry, biology).
    """
    query = db.query(Experiment)
    if subject:
        query = query.filter(Experiment.subject.ilike(subject))
    experiments = query.all()

    # Seed starter experiments if empty
    if not experiments:
        starter_data = [
            Experiment(
                title="Basit Sarkaç ve Periyot Simülasyonu",
                subject="physics",
                description="İpin uzunluğu ve kütlenin sarkaç periyoduna etkisini gözlemleyin.",
                grade_level="Lise",
                simulation_type="interactive",
                content_code="pendulum_component"
            ),
            Experiment(
                title="Asit-Baz Titrasyonu ve pH Değişimi",
                subject="chemistry",
                description="Büret ile titrasyon yaparak indikatör renk değişimini gözlemleyin.",
                grade_level="Lise",
                simulation_type="interactive",
                content_code="titration_component"
            ),
            Experiment(
                title="Hücre Bölünmesi (Mitoz ve Mayoz)",
                subject="biology",
                description="Kromozomların evrelerdeki hareketlerini adım adım simüle edin.",
                grade_level="Ortaokul / Lise",
                simulation_type="interactive",
                content_code="mitosis_component"
            )
        ]
        db.add_all(starter_data)
        db.commit()
        experiments = db.query(Experiment).all()

    return experiments


@router.get("/{id}", response_model=ExperimentOut)
def get_experiment(id: int, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Deney bulunamadı")
    return exp
