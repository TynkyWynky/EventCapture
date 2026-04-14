export async function analyzeBeer(photoUri: string): Promise<boolean> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Randomly return true or false for demo purposes
    // In a real app, this would upload the image to a backend
    return Math.random() > 0.5;
}
