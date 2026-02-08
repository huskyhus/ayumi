import "dotenv/config"; // ✅ 必須：環境変数をロードします
import prisma from "../lib/prisma";

async function testDatabase() {
  console.log("🔍 Prisma Postgres への接続テストを開始します...\n");

  try {
    // 1. 接続確認
    console.log("✅ データベースに接続しました。");

    // 2. テストデータの作成
    console.log("\n📝 テストユーザーを作成中...");
    const newUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    console.log("✅ ユーザー作成成功:", newUser);

    // 3. データの取得
    const count = await prisma.user.count();
    console.log(`\n📊 現在の登録ユーザー数: ${count}`);

    console.log("\n🎉 すべてのテストをパスしました。構成は完璧です。\n");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

testDatabase();
