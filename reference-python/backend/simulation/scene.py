"""PyBullet sahnesinin kurulumu ve robot bilgisi."""

import pybullet as p
import pybullet_data

JOINT_TYPE_NAMES = {
    p.JOINT_REVOLUTE: "revolute",
    p.JOINT_PRISMATIC: "prismatic",
    p.JOINT_SPHERICAL: "spherical",
    p.JOINT_PLANAR: "planar",
    p.JOINT_FIXED: "fixed",
}


def connect(gui: bool = False) -> int:
    """PyBullet client baglantisi baslatir; GUI veya DIRECT mod.

    Testlerde daima gui=False (DIRECT) kullanilmali; GUI pencere acar ve yavastir.
    """
    mode = p.GUI if gui else p.DIRECT
    client_id = p.connect(mode)
    p.setAdditionalSearchPath(pybullet_data.getDataPath())
    p.setGravity(0, 0, -9.8)
    p.loadURDF("plane.urdf")
    return client_id


def load_robot() -> int:
    """KUKA iiwa robotunu sahit tabana sabitlenmis sekilde yukler, robot_id doner."""
    return p.loadURDF("kuka_iiwa/model.urdf", useFixedBase=True)


def joint_info(robot_id: int) -> list[dict]:
    """Robotun her eklemi icin ad, tip ve aci limitlerini dondurur."""
    info = []
    for joint_index in range(p.getNumJoints(robot_id)):
        joint = p.getJointInfo(robot_id, joint_index)
        info.append(
            {
                "index": joint_index,
                "name": joint[1].decode("utf-8"),
                "type": JOINT_TYPE_NAMES.get(joint[2], "unknown"),
                "lower_limit": joint[8],
                "upper_limit": joint[9],
            }
        )
    return info


def end_effector_link_index(robot_id: int) -> int:
    """Uc noktanin bagli oldugu link indeksini dondurur; KUKA iiwa'da son eklem."""
    return p.getNumJoints(robot_id) - 1
