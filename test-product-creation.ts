// Test script to verify product creation API
async function testProductCreation() {
  try {
    // This is a test - in a real scenario, you would need a valid admin token
    const testData = {
      name: "Test Product",
      description: "Test product description",
      price: 10.99,
      image: "/placeholder.svg",
      categoryId: "test-category-id", // This would need to be a valid category ID
      unit: "kg",
      stock: 100,
      featured: false
    };

    console.log("Testing product creation with data:", testData);

    // In a real test, you would make an actual API call here
    // const response = await fetch('/api/admin/products', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // You would need to include a valid authorization header
    //   },
    //   body: JSON.stringify(testData)
    // });

    // console.log('Response:', await response.json());
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testProductCreation();