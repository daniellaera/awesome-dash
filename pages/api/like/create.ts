import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.cookies;
  const { id, authorId } = req.body;

  let likeAuthorId;

  try {
    if (token) {
      // Get the authenticated User
      const { email }: any = jwt.verify(token, process.env.JWT_SECRET || '');
      const me: any = await prisma.user.findUnique({ where: { email } });

      // find all likes for this post
      const allLikes = await prisma.like.findMany({
        where: { postId: id }
      });

      // we map through it and we assign the like authorId to a variable
      allLikes.map(lk => (likeAuthorId = lk.authorId));

      if (me.id === authorId) {
        // we want to avoid that the logged user likes his own post
        return res.status(400).json({ error: 'You cannot like a post you created' });
      }

      if (likeAuthorId === me.id) {
        // we check that the logged user id is the same as the author of this post's like
        // and we avoid he likes the post twice
        return res.status(400).json({ error: 'You cannot like a post twice' });
      }

      const like = await prisma.like.create({
        data: {
          author: {
            connect: { email }
          },
          post: {
            connect: { id }
          }
        }
      });
      res.status(200).json({ success: 'Liked with success', like });
    } else {
      res.json({ error: 'You must be logged in to like' });
    }
  } catch (error) {
    res.json({ error: 'You must be logged in to like' });
    return;
  }
}
