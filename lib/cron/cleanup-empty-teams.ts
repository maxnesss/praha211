import { prisma } from "@/lib/prisma";

export async function removeTeamsWithoutMembers() {
  const deleted = await prisma.team.deleteMany({
    where: {
      users: {
        none: {},
      },
    },
  });

  return deleted.count;
}
