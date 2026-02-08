import prisma from "@/lib/prisma"; // ✅ 直接シングルトン・インスタンスをインポート

export default async function HomePage() {
  // ✅ 直接データベースをクエリ（最も効率的です）
  const users = await prisma.user.findMany({});

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>
        Users Dashboard (Direct Database Access)
      </h1>

      {users.length === 0 ? (
        <p>ユーザーは見つかりませんでした。</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>ID</th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                Name
              </th>
              <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {user.id}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {user.name || "N/A"}
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  {user.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
