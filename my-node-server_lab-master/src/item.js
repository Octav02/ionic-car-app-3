import Router from "koa-router";
import dataStore from "nedb-promise";
import { broadcast } from "./wss.js";

export class ItemStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }

  async find(props) {
    return this.store.find(props);
  }

  async findOne(props) {
    return this.store.findOne(props);
  }

  async insert(car) {
    if (!car.model || !car.producer) {
      throw new Error("Missing model or producer!");
    }

    return this.store.insert(car);
  }

  async update(props, item) {
    console.log("updating" + props._id +  " " + item.model);
    return this.store.update(props, { $set: item });
  }
}

const itemStore = new ItemStore({
  filename: "./db/items.json",
  autoload: true,
});

export const itemRouter = new Router();

itemRouter.get("/", async (ctx) => {
  const userId = ctx.state.user._id;
  ctx.response.body = await itemStore.find({ userId });
  ctx.response.status = 200; // ok
});

itemRouter.get("/:id", async (ctx) => {
  const userId = ctx.state.user._id;
  const item = await itemStore.findOne({ _id: ctx.params.id });
  const response = ctx.response;
  if (item) {
    if (item.userId === userId) {
      ctx.response.body = item;
      ctx.response.status = 200; // ok
    } else {
      ctx.response.status = 403; // forbidden
    }
  } else {
    ctx.response.status = 404; // not found
  }
});

const createItem = async (ctx, car, response) => {
  try {
    const userId = ctx.state.user._id;
    console.log(userId);
    car.userId = userId;
    car.isNotSaved = false;
    response.body = await itemStore.insert(car);
    console.log(response.body);
    response.status = 201; // created
    broadcast(userId, {
      event: "created",
      payload: { updatedCar: response.body },
    });
  } catch (err) {
    console.log(err);
    response.body = { message: err.message };
    response.status = 400; // bad request
  }
};

itemRouter.post(
  "/",
  async (ctx) => await createItem(ctx, ctx.request.body, ctx.response)
);

itemRouter.put("/:id", async (ctx) => {
  const car = ctx.request.body;
  const id = ctx.params.id;
  const carId = car._id;
  const response = ctx.response;
  console.log(carId)
  console.log(id)
  if (carId && carId !== id) {
    response.body = { message: "Param id and body _id should be the same" };
    response.status = 400; // bad request
    return;
  }
  if (!carId) {
    console.log("entered create although put " + carId)
    await createItem(ctx, car, response);
  } else {
    const userId = ctx.state.user._id;
    car.userId = userId;
    const updatedCount = await itemStore.update({ _id: id }, car);
    if (updatedCount === 1) {
      response.body = car;
      response.status = 200; // ok
      car.isNotSaved = false;
      broadcast(userId, {
        event: "updated",
        payload: { successMessage: "Updated car!", updatedCar: car },
      });
    } else {
      response.body = { message: "Resource no longer exists" };
      response.status = 405; // method not allowed
    }
  }
});
