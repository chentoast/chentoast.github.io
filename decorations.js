let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let balls = [];

const maxballs = 20;

const obj_density = 1;

let fps = 60;
let dt = 1 / fps;

let colors = ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#d8bf78", "#d6e392", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"];
ctx.globalAlpha = 0.6;

function Ball(x, y, color, rawRadius, radius) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 5;
  this.color = color;
  this.rawRadius = rawRadius;
  this.radius = radius;
  // this.mass = radius * obj_density;
  // this.mass = (Math.PI * (radius / width) ** 2 * obj_density);
  this.mass = width * height / 1000;
}

function onClick(e) {
  let x = e.clientX;
  let y = e.clientY;

  let size = Math.min(height, width)
  let rawRadius = Math.random()
  let radius = Math.ceil(rawRadius * (size / 40) + (size / 80));
  for (let ball of balls) {
    if (
      Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2) <
      ball.radius + radius
    ) {
      return;
    }
  }
  let ball = new Ball(
    e.clientX,
    e.clientY,
    colors[Math.floor(Math.random() * colors.length)],
    rawRadius,
    radius
  );
  balls.push(ball);

  if (balls.length > maxballs) {
    balls.shift();
  }
}

function onResize(e) {
  let oldWidth = width;
  let oldHeight = height;
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext("2d");
  ctx.globalAlpha = 0.6;

  let oldSize = Math.min(oldHeight, oldWidth)
  let size = Math.min(height, width)
  for (let ball of balls) {
    // ball.radius = (ball.radius + 0.5 - (oldSize / 80)) / (oldSize / 40);
    ball.radius = Math.ceil(ball.rawRadius * (size / 40) + (size / 80));
    ball.mass = (width * height) / 1000;
  }
}

const wall_restitution = 0.7;
function handleWallCollision(ball) {
  if (ball.x + ball.radius >= width) {
    ball.vx *= -wall_restitution;
    ball.x = width - ball.radius;
  }
  if (ball.x <= ball.radius) {
    ball.vx *= wall_restitution;
    ball.x = ball.radius;
  }
  if (ball.y + ball.radius >= height - 5) {
    ball.vy *= -wall_restitution;
    ball.y = height - ball.radius - 5;
  }
  if (ball.y <= ball.radius) {
    ball.vy *= wall_restitution;
    ball.y = ball.radius;
  }
}

const ball_restitution = 0.8;
function handleBallCollision(ball, balls) {
  for (let other of balls) {
    if (ball.x == other.x && ball.y == other.y) {
      continue;
    }

    if (
      ball.x + ball.radius + other.radius > other.x &&
      ball.x < other.x + ball.radius + other.radius &&
      ball.y + ball.radius + other.radius > other.y &&
      ball.y < other.y + ball.radius + other.radius
    ) {
      let dist = Math.sqrt((ball.x - other.x) ** 2 + (ball.y - other.y) ** 2);
      if (dist <= ball.radius + other.radius) {
        // calulating the point of collision
        let colPointX =
          (ball.x * other.radius + other.x * ball.radius) /
          (ball.radius + other.radius);
        let colPointY =
          (ball.y * other.radius + other.y * ball.radius) /
          (ball.radius + other.radius);

        //stoping overlap
        ball.x =
          colPointX + (ball.radius * (ball.x - other.x)) / Math.floor(dist);
        ball.y =
          colPointY + (ball.radius * (ball.y - other.y)) / Math.floor(dist);
        other.x =
          colPointX + (other.radius * (other.x - ball.x)) / Math.floor(dist);
        other.y =
          colPointY + (other.radius * (other.y - ball.y)) / Math.floor(dist);

        let xdiff = ball.x - other.x;
        let ydiff = ball.y - other.y;
        let dot = (ball.vx - other.vx) * xdiff + (ball.vy - other.vy) * ydiff;

        dot = Math.min(Math.abs(dot), 800) * Math.sign(dot)
        dist = Math.max(dist, ball.radius + other.radius)

        ball.vx -=
          (ball_restitution * (2 * other.mass * dot * xdiff)) /
          ((ball.mass + other.mass) * dist ** 2);
        ball.vy -=
          (ball_restitution * (2 * other.mass * dot * ydiff)) /
          ((ball.mass + other.mass) * dist ** 2);
        other.vx +=
          (ball_restitution * (2 * ball.mass * dot * xdiff)) /
          ((ball.mass + other.mass) * dist ** 2);
        other.vy +=
          (ball_restitution * (2 * ball.mass * dot * ydiff)) /
          ((ball.mass + other.mass) * dist ** 2);

      }
    }
  }
}

const gravity = 9.8;
const drag_coef = 0.47;
const air_density = 1.2;
function render() {
  // some minor technical details:
  // air_density is kg / m^3
  // distances are in meters
  ctx.clearRect(0, 0, width, height);
  for (let ball of balls) {
  //   let drag_x = -0.5 * drag_coef * air_density * Math.sign(ball.vx) * ball.vx ** 2 * ball.radius;
  //   let drag_y = -0.5 * drag_coef * air_density * Math.sign(ball.vy) * ball.vy ** 2 * ball.radius;
    let drag_x = -0.5 * drag_coef * air_density * Math.sign(ball.vx) * ball.vx ** 2;
    let drag_y = -0.5 * drag_coef * air_density * Math.sign(ball.vy) * ball.vy ** 2;
    let drag_force_x = drag_x / (ball.mass);
    let drag_force_y = drag_y / (ball.mass);

    let ax = drag_force_x;
    let ay = gravity + drag_force_y;

    ball.vx += ax * dt;
    ball.vy += ay * dt;

    ball.x += ball.vx * dt * (height / 10);
    ball.y += ball.vy * dt * (height / 10);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fillStyle = ball.color;
    ctx.fill();

    handleBallCollision(ball, balls);
    handleWallCollision(ball);
  }
}
document.addEventListener("click", onClick);
window.addEventListener("resize", onResize);
setInterval(render, dt * 1000);
