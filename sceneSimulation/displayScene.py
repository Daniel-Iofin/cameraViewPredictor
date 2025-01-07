import turtle
import json

def draw_scene(file_path):
    # Read file and parse JSON
    with open(file_path, 'r') as file:
        content = json.loads(file.read())

    # Global variables 
    factor = 6
    bounds = 64

    # Initialize
    screen = turtle.Screen()
    screen.setup(bounds*factor, bounds*factor)
    screen.setworldcoordinates(0, 0, bounds*factor, bounds*factor)
    turtle.colormode(255)
    t = turtle.Turtle()
    t.speed(0)
    t.hideturtle()

    # Draw bounding box
    t.goto(0,0)
    t.pendown()
    t.goto(0, factor*bounds)
    t.goto(factor*bounds, factor*bounds)
    t.goto(factor*bounds, 0)
    t.goto(0,0)

    # Draw scene edges
    for edge in content[0]:
        x1, y1 = edge[0]
        x2, y2 = edge[1]
        r, g, b = map(int, edge[2].split(','))

        t.penup()
        t.goto(x1*factor, y1*factor)
        t.pendown()
        t.pencolor(r, g, b)
        t.goto(x2*factor, y2*factor)

    # Draw camera lines
    for camera_lines in content[1:-1]:
        for line in camera_lines:
            x1, y1 = line[0]
            x2, y2 = line[1]
            r, g, b = map(int, line[2].split(','))

            t.penup()
            t.goto(x1*factor, y1*factor)
            t.pendown()
            t.pencolor(r, g, b)
            t.goto(x2*factor, y2*factor)

    # Draw horizontal view lines
    t.pensize(5)
    y_pos = -25
    for view in content[-1]:
        for segment in view:
            start, end, color = segment
            r, g, b = map(int, color.split(','))
            
            t.penup()
            t.goto(start*bounds*factor, y_pos)
            t.pencolor(r, g, b)
            t.pendown()
            t.goto(end*bounds*factor, y_pos)
        y_pos -= 25

    # Keep the window open until clicked
    screen.exitonclick()

# Call the function with the path to your scene.txt
draw_scene('scene.txt')
