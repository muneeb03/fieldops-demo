import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function TodosPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Supabase todos</h1>

      {error ? (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      ) : (
        <ul className="mt-4 list-disc space-y-1 pl-6">
          {todos?.length ? (
            todos.map((todo: { id: string | number; name?: string }) => (
              <li key={todo.id}>{todo.name ?? String(todo.id)}</li>
            ))
          ) : (
            <li className="list-none pl-0 text-slate-600">No todos yet.</li>
          )}
        </ul>
      )}
    </main>
  );
}
