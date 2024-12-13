import math
from camera import Camera
from geometries import Edge, Equation, Vertex



def mod(n, m):
    return ((n % m) + m) % m


def get_vertex_angles(vertices, camera):
    for vertex in vertices:
        delta_x = vertex.x - camera.x
        delta_y = vertex.y - camera.y

        angle_from_horizontal = math.atan2(delta_x, delta_y)
        angle_from_camera_center = angle_from_horizontal - camera.direction

        vertex.set_camera_angle(angle_from_camera_center)
    return vertices


def order_edges(vertices, edges):
    edges.sort(key=lambda edge: edge.get_left_vertex_angle(vertices))
    return edges


def find_front_edge(camera, angle, vertices, edges):
    camera_x, camera_y = camera.x, camera.y
    m = 1 / math.tan(angle) if angle != 0 else math.inf
    b = camera_y - m * camera_x if m != math.inf else camera.x

    camera_equation = Equation(m, b)

    edge_projections = []
    for edge in edges:
        vertex1 = next(v for v in vertices if v.id == edge.vertex1_id)
        vertex2 = next(v for v in vertices if v.id == edge.vertex2_id)

        edge_equation = Equation().generate(vertex1, vertex2)
        intersection = camera_equation.intersection(edge_equation)
        if intersection:
            distance = math.sqrt((intersection.x - camera_x) ** 2 + (intersection.y - camera_y) ** 2)
            edge_projections.append({"id": edge.id, "projection": distance})

    if not edge_projections:
        return None

    front_edge = min(edge_projections, key=lambda edge: edge["projection"])
    return front_edge


def get_view(edges, vertices, camera):
    view = []

    for vertex in vertices:
        camera_angle = vertex.camera_angle
        active_edges = []

        for edge in edges:
            vertex1 = next(v for v in vertices if v.id == edge.vertex1_id)
            vertex2 = next(v for v in vertices if v.id == edge.vertex2_id)

            if vertex1.camera_angle <= camera_angle <= vertex2.camera_angle:
                active_edges.append(edge)

        true_angle = camera.direction + camera_angle
        front_edge = find_front_edge(camera, true_angle, vertices, active_edges)

        view.append((camera_angle, front_edge["id"] if front_edge else None))

    return view


def get_view_edges(vertices, edges, camera):
    vertices.sort(key=lambda v: v.camera_angle)
    edges = order_edges(vertices, edges)
    view = get_view(edges, vertices, camera)

    color_view = []
    for element in view:
        edge_id = element[1]
        adjusted_view = element[0] + (camera.direction + camera.angle / 2) - math.pi / 2
        color_view.append((adjusted_view, next(e for e in edges if e.id == edge_id).color if edge_id else None))
    return color_view


def get_camera_view(camera, vertices, edges):
    # Step 1: Calculate angles for each vertex relative to the camera
    get_vertex_angles(vertices, camera)

    # Step 2: Sort edges by angle
    ordered_edges = order_edges(vertices, edges)

    # Step 3: Generate the view based on active edges and vertex angles
    view = get_view(ordered_edges, vertices, camera)

    return view


class Simulate2D:
    def __init__(self, vertices, edges, camera):
        self.vertices = vertices
        self.edges = edges
        self.camera = camera

    def predict(self):
        self.vertices = get_vertex_angles(self.vertices, self.camera)
        view = get_view_edges(self.vertices, self.edges, self.camera)
        return view


vertices = [Vertex(0, 10, 40), Vertex(1, 20, 50), Vertex(2, 40, 40), Vertex(3, 50, 40)]
edges = [Edge(0, 0, 2), Edge(1, 1, 3)]
camera = Camera(0, 10, 10, math.pi * 1 / 4, math.pi * 1 / 2)
camera2 = Camera(0, 12, 13, math.pi * 1 / 4 + 0.1, math.pi * 1 / 2)
cameratest = Camera(0, 20, 15, math.pi * 1 / 4 + 0.5, math.pi * 1 / 2)
simulation = Simulate2D(vertices, edges, camera)

content = ""
for edge in edges:
    try:
        x1_vertex = next(vertex for vertex in vertices if vertex.id == edge.vertex1_id)
        y1_vertex = next(vertex for vertex in vertices if vertex.id == edge.vertex1_id)
        x2_vertex = next(vertex for vertex in vertices if vertex.id == edge.vertex2_id)
        y2_vertex = next(vertex for vertex in vertices if vertex.id == edge.vertex2_id)
        edge_text = f"{x1_vertex.x},{y1_vertex.y};{x2_vertex.x},{y2_vertex.y};{edge.color}\n"
        content += edge_text
    except:
        pass

view = simulation.predict()
print(view)

# Generate the camera view for the given camera
camera_view = get_camera_view(camera, vertices, edges)
print("Camera View:", camera_view)

with open("scene.txt", "w") as file:
    file.write(content)
    print("File has been written successfully.")
