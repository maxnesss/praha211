import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

type JoinTeamRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: JoinTeamRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug } = await context.params;
  return NextResponse.json(
    {
      message: `Přímé připojení je vypnuté. Pošlete žádost přes /api/teams/${slug}/apply.`,
    },
    { status: 410 },
  );
}
