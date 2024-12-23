import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {

    const body = await req.json();
    const { email: emailToAdd } = addFriendValidator.parse(body.email);  // this is a key value pair that's why it's read as such.
    const idToAdd = (await fetchRedis(
      "get",
      `user:email:${emailToAdd}`
    )) as string;
    if (!idToAdd) {
      return new Response("This person doesn't exist", { status: 400 });
    }


    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(`Unauthorized`, { status: 401 });
    }

    // is the person sending friend request to himself
    if (idToAdd == session.user.id) {
      return new Response("You cannot add yourself", { status: 400 });
    }

    // is the person already a friend
    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      session.user.id
    )) as 0 | 1;
    if (isAlreadyAdded) {
      return new Response("ALready Added this User", { status: 400 });
    }

    const isAlreadyFriend = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 0 | 1;

    if (isAlreadyFriend) {
      return new Response("ALready Friend with this User", { status: 400 });
    }

    pusherServer.trigger(                                                  // the friend request should appear in real time 
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`),             // this triggers the event incoming friend requests 
      "incoming_friend_requests",
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
      }
    );

    db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id); // updating db adding friend_request 

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid Request Payload", { status: 422 });
    }
    return new Response("Invalid Request", { status: 400 });
  }
}
