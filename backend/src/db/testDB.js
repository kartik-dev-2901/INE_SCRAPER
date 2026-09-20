const supabase = require("./supabase");

async function testConnection() {
    const { data, error } = await supabase
        .from("tracked_products")
        .select("*");

    if (error) {
        console.error("Database connection failed:");
        console.error(error);
        return;
    }

    console.log("Database connected successfully!");
    console.log(data);
}

testConnection();