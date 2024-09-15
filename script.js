const { World, Engine, Render, Runner, Bodies, Body, Events } = Matter;
// 1st create the engine
const engine = Engine.create();
//TO DISABLE GRAVITY IN Y DIRECTION
engine.world.gravity.y = 0;
//2nd destructure the world object from engine
const { world } = engine;
//3d create the render and tell the Render object where to show the element in html.
const height = window.innerHeight - 100;
const width = window.innerWidth - 100;
const columns = 8;
const rows = 6;
const unitLengthX = width / columns;
const unitLengthY = height / rows;
const render = Render.create({
  element: document.body,
  engine,
  options: {
    width,
    height,
    wireframes: false,
  },
});
//run the render
Render.run(render);
Runner.run(Runner.create(), engine);
//UNTIL NOW OUR WORLD IS CREATED.
//NEXT STEPS
//Create the body which ever you want.
//x = 200, y = 200, width: 50, height:50
// const shape = Bodies.rectangle(200, 200, 50, 50, {
//   isStatic: true,
// });
//Now add the shape to the world.
//World.add(world, shape);
/*
 * POINT TO BE NOTICED 
    by default there will be wireframes mode enable so
    we can only see the outline of any body, after disabling it
    we will get the style. 
    TO DISABLES THIS
    Go to Render.create() and then in options object do wireframes:false
    WHAT FOR OUR OWN STYLE?
    Go the body which you create and then in options object add
    {
        isStatic:true,
        render:
        {
            fillStyle:"color"
        }
    }
 */

//WALLS
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];
World.add(world, walls);

//GENERATING THE MAZE
//GRID ARRAY.
const grid = Array(rows)
  .fill(null)
  .map(() => Array(columns).fill(false));

// console.log(grid);
//VERTICAL ARRAY
const verticals = Array(rows)
  .fill(null)
  .map(() => Array(columns - 1).fill(false));
// console.log(verticals);
//HORIZONTAL ARRAY
const horizontals = Array(rows - 1)
  .fill(null)
  .map(() => Array(columns - 1).fill(false));
// console.log(horizontals);

//SHUFFLING LOGIC
const shuffle = (arr) => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    [arr[index], arr[counter]] = [arr[counter], arr[index]];
  }
  return arr;
};

//MAZE ALGORITHM
const startRow = Math.floor(Math.random() * rows);
const startColumn = Math.floor(Math.random() * columns);

const stepThroughCell = (row, column) => {
  //IF I HAVE VISITED THE CELL [row,column], then return
  if (grid[row][column]) return;
  //MARK THE CURRENT CELL AS VISITED CELL.
  grid[row][column] = true;
  //ASSEMBLE RANDOMLY ORDERED LIST OF NEIGHBORS
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);
  // console.log(neighbors);
  //FOR EACH NEIGHBOR....
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    //SEE IF THAT NEIGHBOR IS OUT OF BOUNDS
    if (
      nextRow < 0 ||
      nextRow >= rows ||
      nextColumn < 0 ||
      nextColumn >= columns
    )
      continue;
    // IF WE HAVE VISITED THAT NEIGHBOR, CONTINUE TO NEXT NEIGHBOR
    if (grid[nextRow][nextColumn]) continue;
    //REMOVE THE WALL FROM THE EITHER HORIZONTALS OR VERTICALS.
    if (direction === "left") verticals[row][column - 1] = true;
    else if (direction === "right") verticals[row][column] = true;
    else if (direction === "up") horizontals[row - 1][column] = true;
    else if (direction === "down") horizontals[row][column] = true;
    //VISITS THE NEXT CELL.
    stepThroughCell(nextRow, nextColumn);
  }
};
stepThroughCell(startRow, startColumn);

//DRAW THE HORIZONTALS LINES IN WORLD
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "violet",
        },
      }
    );
    World.add(world, wall);
  });
});

//DRAW THE VERTICALS LINES IN WORLD
verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "violet",
        },
      }
    );
    World.add(world, wall);
  });
});

//DRAW THE GOAL
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    isStatic: true,
    label: "goal",
    render: {
      fillStyle: "green",
    },
  }
);
World.add(world, goal);

//DRAW THE BALL
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: {
    fillStyle: "#fff",
  },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { keyCode } = event;
  const { velocity } = ball;
  const { x, y } = velocity;

  if (keyCode === 38) Body.setVelocity(ball, { x, y: y - 5 });
  else if (keyCode === 40) Body.setVelocity(ball, { x, y: y + 5 });
  else if (keyCode === 37) Body.setVelocity(ball, { x: x - 5, y });
  else if (keyCode === 39) Body.setVelocity(ball, { x: x + 5, y });
});

//CHECKING FOR COLLISION WIN CONDITION.
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.bodies.forEach((body) => {
        if (body.label === "wall") Body.setStatic(body, false);
      });
      world.gravity.y = 1;
      document.querySelector(".winner").classList.remove("hidden");
    }
  });
});
