"""generic-2dof robotu icin analitik FK dogrulama fixture'lari uretir.

TypeScript'teki DH tabanli forward kinematics (lib/robotics/kinematics.ts)
kod tekrari olmadan, bagimsiz trigonometrik formulle capraz dogrulanir:
x = a1*cos(theta1) + a2*cos(theta1+theta2), y = a1*sin(theta1) + a2*sin(theta1+theta2)
"""

import json
import math
from pathlib import Path

A1 = 1.0
A2 = 0.8

TEST_CASES_DEG = [
    (0, 0),
    (90, 0),
    (0, 90),
    (45, 45),
    (-30, 60),
    (180, -90),
    (30, -120),
    (-90, -90),
    (60, 0),  # tekillik: tam acik (theta2=0)
    (60, 180),  # tekillik: tam katli (theta2=180)
]


def forward_kinematics(theta1: float, theta2: float) -> dict:
    joint1_x = A1 * math.cos(theta1)
    joint1_y = A1 * math.sin(theta1)
    end_x = joint1_x + A2 * math.cos(theta1 + theta2)
    end_y = joint1_y + A2 * math.sin(theta1 + theta2)
    return {
        "joint1Position": {"x": joint1_x, "y": joint1_y, "z": 0.0},
        "endEffector": {"x": end_x, "y": end_y, "z": 0.0},
    }


def jacobian(theta1: float, theta2: float) -> dict:
    """Analitik 2x2 Jacobian (ucun x,y hizi = J * eklem hizlari).

    TS tarafindaki geometrik Jacobian (crossProduct tabanli) ile BAGIMSIZ
    bir formul: dogrudan x=a1*cos(t1)+a2*cos(t1+t2) fonksiyonlarinin kismi
    turevleri. Manipulabilite = |det(J)| = |a1*a2*sin(theta2)| (klasik
    2 baglantili kol sonucu).
    """
    s1, c1 = math.sin(theta1), math.cos(theta1)
    s12, c12 = math.sin(theta1 + theta2), math.cos(theta1 + theta2)

    j = [
        [-A1 * s1 - A2 * s12, -A2 * s12],
        [A1 * c1 + A2 * c12, A2 * c12],
    ]
    manipulability = abs(j[0][0] * j[1][1] - j[0][1] * j[1][0])
    return {"matrix": j, "manipulability": manipulability}


def main() -> None:
    cases = []
    for theta1_deg, theta2_deg in TEST_CASES_DEG:
        theta1 = math.radians(theta1_deg)
        theta2 = math.radians(theta2_deg)
        result = forward_kinematics(theta1, theta2)
        cases.append(
            {
                "jointAnglesDeg": [theta1_deg, theta2_deg],
                "jointAnglesRad": [theta1, theta2],
                **result,
                "jacobian": jacobian(theta1, theta2),
            }
        )

    fixture = {
        "robot": "generic-2dof",
        "linkLengths": {"a1": A1, "a2": A2},
        "tolerance": 1e-6,
        "cases": cases,
    }

    output_path = Path(__file__).resolve().parent.parent / "fixtures" / "generic-2dof-fk.json"
    output_path.write_text(json.dumps(fixture, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(cases)} fixture uretildi: {output_path}")


if __name__ == "__main__":
    main()
