import { rupaul_agent } from "./agent";

export async function runAgent() {
  try {
    // Initialize the agent
    await rupaul_agent.init();

    // Example of running the agent with a fixed interval
    await rupaul_agent.run(60, { verbose: true });

    // Alternative: Run the agent step by step
    // await rupaul_agent.step();

    // Example of running a specific worker with a task

    // const worker = rupaul_agent.getWorkerById("hello_worker");
    // if (worker) {
    //     await worker.runTask(
    //         "be friendly and welcoming",
    //         { verbose: true }
    //     );
    // }
  } catch (error) {
    console.error("Error running agent:", error);
  }
}
