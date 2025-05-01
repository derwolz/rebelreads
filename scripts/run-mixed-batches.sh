#!/bin/bash

# Run 10 batches of 20 users each (total of 200 users)
for i in {1..10}
do
  echo "Running mixed ratings batch $i of 10..."
  npx tsx scripts/generate-mixed-ratings-batch.ts $i
  echo "Batch $i completed. Waiting a few seconds before next batch..."
  sleep 3
done

echo "All mixed rating batches completed!"