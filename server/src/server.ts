import "reflect-metadata"; //typeorm need this

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import __prod__ from "./constants";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { AnimePostResolver } from "./resolvers/animePost";
import { AnimePost } from "./Entities/AnimePost";
import { User } from "./Entities/User";
import { UserResolver } from "./resolvers/user";
import { PorfileResolver } from "./resolvers/profile";
import { Profile } from "./Entities/Profile";
import { Comment } from "./Entities/Comment";
import { Anime } from "./Entities/FavAnime";

//declare this for the session
declare module "express-session" {
  interface Session {
    userId: number;
  }
}

const main = async () => {
  //typeorm
  const connection = await createConnection({
    type: "postgres",
    database: "otaku",
    username: "postgres",
    password: "secret123",
    logging: true,
    synchronize: true,
    entities: [AnimePost, User, Profile, Comment, Anime],
  });
  // await Anime.delete({});
  // // await User.delete({});
  // await Profile.delete({});
  // await Comment.delete({});
  // await AnimePost.delete({});/

  // //runnnnn ittta
  const app = express();

  //2 cookie Redis
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "cid", //cookie name
      store: new RedisStore({
        client: redis,
        disableTouch: true, //true to keep the user for too long
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years,
        httpOnly: true, //in your js code and frontend you cannot access the cookie
        secure: !__prod__, //cookie only works in https
        sameSite: "lax", //csrf
      },
      saveUninitialized: false, //it will create a session by default turn it to false so we can add
      secret: "asfasfasfasfasfacWTGSD",
      resave: false,
    })
  );

  //for building schema and running controllers or resolvers
  //for GRAPHQL
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        AnimePostResolver,
        UserResolver,
        PorfileResolver,
      ],
      validate: false,
    }),
    //to access an object
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  //to create a graphql endpoint for us on express
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(5000, () => {
    console.log("server is connected in 5000");
  });
};
main().catch((e) => {
  console.log(e);
});
