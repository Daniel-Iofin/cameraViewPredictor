class Vertex:
    def __init__(self, vertex_id, x, y):
        self.id = vertex_id
        self.x = x
        self.y = y
        self.camera_angle = None

    def set_camera_angle(self, angle):
        self.camera_angle = angle
