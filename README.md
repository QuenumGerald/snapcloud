# SnapCloud

SnapCloud converts a high level requirement into AWS deliverables. It now performs real requests to the **MiniMax** API to generate tasks, an architecture diagram, a CloudFormation template and a cost estimation.

## Usage

Set the environment variables before running the backend:

```
MINIMAX_API_KEY=your_key_here
# MINIMAX_API_URL=https://api.minimax.io/v1/text/chatcompletion_v2 (optional)
```

Start the API server:

```
npm run dev
```

Send a POST request to `/generate` with a JSON body containing `requirement` to receive the deliverables.
