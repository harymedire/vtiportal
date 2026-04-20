"""Učitava varijable iz pool.py u template_variables tabelu.

Pokreni jednom nakon migracija:
    python scripts/seed_variables.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.models import TemplateVariable
from app.services.database import get_db
from app.variables.pool import VARIABLE_POOL


def main():
    total = 0
    with get_db() as db:
        # Obriši stare
        db.query(TemplateVariable).delete()

        for template_id, vars_dict in VARIABLE_POOL.items():
            for var_name, values in vars_dict.items():
                for value in values:
                    db.add(TemplateVariable(
                        template_id=template_id,
                        variable_name=var_name,
                        variable_value=value,
                        weight=1,
                        active=True,
                    ))
                    total += 1

    print(f"✅ Seeded {total} template variables across {len(VARIABLE_POOL)} templates")


if __name__ == "__main__":
    main()
