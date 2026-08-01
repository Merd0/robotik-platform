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
