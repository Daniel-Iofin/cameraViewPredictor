import random

class Edge:
    def __init__(self, id, vertex1_id, vertex2_id):
        self.id = id
        self.vertex1_id = vertex1_id
        self.vertex2_id = vertex2_id

        # Generate random color
        r = 0  # Red component fixed at 0
        g = random.randint(0, 254)  # Green component between 0 and 254
        b = random.randint(0, 254)  # Blue component between 0 and 254
        self.color = f"{r},{g},{b}"

    def get_left_vertex_angle(self, vertices):
        # Find vertices by their ids
        vertex1 = next((vertex for vertex in vertices if vertex.id == self.vertex1_id), None)
        vertex2 = next((vertex for vertex in vertices if vertex.id == self.vertex2_id), None)

        if vertex1 is None or vertex2 is None:
            raise ValueError("One or both vertices not found")

        # Return the minimum of the two vertex angles
        return min(vertex1.camera_angle, vertex2.camera_angle)
