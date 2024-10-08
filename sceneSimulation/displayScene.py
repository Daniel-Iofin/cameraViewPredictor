import turtle

def draw_scene(file_path):
    # Read file
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Global variables
    factor=6
    bounds=64

    # Initialize
    screen = turtle.Screen()
    screen.setup(bounds*factor, bounds*factor)
    screen.setworldcoordinates(0, 0, bounds*factor, bounds*factor)
    turtle.colormode(255)
    t = turtle.Turtle()
    t.speed(0)
    t.hideturtle()

    t.goto(0,0)
    t.pendown()
    t.goto(0, factor*bounds)
    t.goto(factor*bounds, factor*bounds)
    t.goto(factor*bounds, 0)
    t.goto(0,0)



    for line in lines:
        # Parse the line: x1,y1;x2,y2;r,g,b
        point1, point2, rgb = line.split(';')
        x1, y1 = float(point1.split(',')[0]), float(point1.split(',')[1])
        x2, y2 = float(point2.split(',')[0]), float(point2.split(',')[1])
        r, g, b = map(int, rgb.split(','))

        # Move the turtle to the starting point without drawing
        t.penup()
        t.goto(x1*factor, y1*factor)
        t.pendown()

        # Set the line color
        t.pencolor(r, g, b)

        # Draw the line
        t.goto(x2*factor, y2*factor)
        print("done")

    # Keep the window open until clicked
    screen.exitonclick()

# Call the function with the path to your scene.txt
draw_scene('scene.txt')
