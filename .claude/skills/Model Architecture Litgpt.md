---

name: implementing-llms-litgpt

description: Implements and trains LLMs using Lightning AI's LitGPT with 20+ pretrained architectures (Llama, Gemma, Phi, Qwen, Mistral). Use when need clean model implementations, educational understanding of architectures, or production fine-tuning with LoRA/QLoRA. Single-file implementations, no abstraction layers.

version: 1.0.0

author: Orchestra Research

license: MIT

tags: \[Model Architecture, LitGPT, Lightning AI, LLM Implementation, LoRA, QLoRA, Fine-Tuning, Llama, Gemma, Phi, Mistral, Educational]

dependencies: \[litgpt, torch, transformers]

---



\# LitGPT - Clean LLM Implementations



\## Quick start



LitGPT provides 20+ pretrained LLM implementations with clean, readable code and production-ready training workflows.



\*\*Installation\*\*:

```bash

pip install 'litgpt\[extra]'

```



\*\*Load and use any model\*\*:

```python

from litgpt import LLM



\# Load pretrained model

llm = LLM.load("microsoft/phi-2")



\# Generate text

result = llm.generate(

&#x20;   "What is the capital of France?",

&#x20;   max\_new\_tokens=50,

&#x20;   temperature=0.7

)

print(result)

```



\*\*List available models\*\*:

```bash

litgpt download list

```



\## Common workflows



\### Workflow 1: Fine-tune on custom dataset



Copy this checklist:



```

Fine-Tuning Setup:

\- \[ ] Step 1: Download pretrained model

\- \[ ] Step 2: Prepare dataset

\- \[ ] Step 3: Configure training

\- \[ ] Step 4: Run fine-tuning

```



\*\*Step 1: Download pretrained model\*\*



```bash

\# Download Llama 3 8B

litgpt download meta-llama/Meta-Llama-3-8B



\# Download Phi-2 (smaller, faster)

litgpt download microsoft/phi-2



\# Download Gemma 2B

litgpt download google/gemma-2b

```



Models are saved to `checkpoints/` directory.



\*\*Step 2: Prepare dataset\*\*



LitGPT supports multiple formats:



\*\*Alpaca format\*\* (instruction-response):

```json

\[

&#x20; {

&#x20;   "instruction": "What is the capital of France?",

&#x20;   "input": "",

&#x20;   "output": "The capital of France is Paris."

&#x20; },

&#x20; {

&#x20;   "instruction": "Translate to Spanish: Hello, how are you?",

&#x20;   "input": "",

&#x20;   "output": "Hola, ¿cómo estás?"

&#x20; }

]

```



Save as `data/my\_dataset.json`.



\*\*Step 3: Configure training\*\*



```bash

\# Full fine-tuning (requires 40GB+ GPU for 7B models)

litgpt finetune \\

&#x20; meta-llama/Meta-Llama-3-8B \\

&#x20; --data JSON \\

&#x20; --data.json\_path data/my\_dataset.json \\

&#x20; --train.max\_steps 1000 \\

&#x20; --train.learning\_rate 2e-5 \\

&#x20; --train.micro\_batch\_size 1 \\

&#x20; --train.global\_batch\_size 16



\# LoRA fine-tuning (efficient, 16GB GPU)

litgpt finetune\_lora \\

&#x20; microsoft/phi-2 \\

&#x20; --data JSON \\

&#x20; --data.json\_path data/my\_dataset.json \\

&#x20; --lora\_r 16 \\

&#x20; --lora\_alpha 32 \\

&#x20; --lora\_dropout 0.05 \\

&#x20; --train.max\_steps 1000 \\

&#x20; --train.learning\_rate 1e-4

```



\*\*Step 4: Run fine-tuning\*\*



Training saves checkpoints to `out/finetune/` automatically.



Monitor training:

```bash

\# View logs

tail -f out/finetune/logs.txt



\# TensorBoard (if using --train.logger\_name tensorboard)

tensorboard --logdir out/finetune/lightning\_logs

```



\### Workflow 2: LoRA fine-tuning on single GPU



Most memory-efficient option.



```

LoRA Training:

\- \[ ] Step 1: Choose base model

\- \[ ] Step 2: Configure LoRA parameters

\- \[ ] Step 3: Train with LoRA

\- \[ ] Step 4: Merge LoRA weights (optional)

```



\*\*Step 1: Choose base model\*\*



For limited GPU memory (12-16GB):

\- \*\*Phi-2\*\* (2.7B) - Best quality/size tradeoff

\- \*\*Llama 3 1B\*\* - Smallest, fastest

\- \*\*Gemma 2B\*\* - Good reasoning



\*\*Step 2: Configure LoRA parameters\*\*



```bash

litgpt finetune\_lora \\

&#x20; microsoft/phi-2 \\

&#x20; --data JSON \\

&#x20; --data.json\_path data/my\_dataset.json \\

&#x20; --lora\_r 16 \\          # LoRA rank (8-64, higher=more capacity)

&#x20; --lora\_alpha 32 \\      # LoRA scaling (typically 2×r)

&#x20; --lora\_dropout 0.05 \\  # Prevent overfitting

&#x20; --lora\_query true \\    # Apply LoRA to query projection

&#x20; --lora\_key false \\     # Usually not needed

&#x20; --lora\_value true \\    # Apply LoRA to value projection

&#x20; --lora\_projection true \\  # Apply LoRA to output projection

&#x20; --lora\_mlp false \\     # Usually not needed

&#x20; --lora\_head false      # Usually not needed

```



LoRA rank guide:

\- `r=8`: Lightweight, 2-4MB adapters

\- `r=16`: Standard, good quality

\- `r=32`: High capacity, use for complex tasks

\- `r=64`: Maximum quality, 4× larger adapters



\*\*Step 3: Train with LoRA\*\*



```bash

litgpt finetune\_lora \\

&#x20; microsoft/phi-2 \\

&#x20; --data JSON \\

&#x20; --data.json\_path data/my\_dataset.json \\

&#x20; --lora\_r 16 \\

&#x20; --train.epochs 3 \\

&#x20; --train.learning\_rate 1e-4 \\

&#x20; --train.micro\_batch\_size 4 \\

&#x20; --train.global\_batch\_size 32 \\

&#x20; --out\_dir out/phi2-lora



\# Memory usage: \~8-12GB for Phi-2 with LoRA

```



\*\*Step 4: Merge LoRA weights\*\* (optional)



Merge LoRA adapters into base model for deployment:



```bash

litgpt merge\_lora \\

&#x20; out/phi2-lora/final \\

&#x20; --out\_dir out/phi2-merged

```



Now use merged model:

```python

from litgpt import LLM

llm = LLM.load("out/phi2-merged")

```



\### Workflow 3: Pretrain from scratch



Train new model on your domain data.



```

Pretraining:

\- \[ ] Step 1: Prepare pretraining dataset

\- \[ ] Step 2: Configure model architecture

\- \[ ] Step 3: Set up multi-GPU training

\- \[ ] Step 4: Launch pretraining

```



\*\*Step 1: Prepare pretraining dataset\*\*



LitGPT expects tokenized data. Use `prepare\_dataset.py`:



```bash

python scripts/prepare\_dataset.py \\

&#x20; --source\_path data/my\_corpus.txt \\

&#x20; --checkpoint\_dir checkpoints/tokenizer \\

&#x20; --destination\_path data/pretrain \\

&#x20; --split train,val

```



\*\*Step 2: Configure model architecture\*\*



Edit config file or use existing:



```python

\# config/pythia-160m.yaml

model\_name: pythia-160m

block\_size: 2048

vocab\_size: 50304

n\_layer: 12

n\_head: 12

n\_embd: 768

rotary\_percentage: 0.25

parallel\_residual: true

bias: true

```



\*\*Step 3: Set up multi-GPU training\*\*



```bash

\# Single GPU

litgpt pretrain \\

&#x20; --config config/pythia-160m.yaml \\

&#x20; --data.data\_dir data/pretrain \\

&#x20; --train.max\_tokens 10\_000\_000\_000



\# Multi-GPU with FSDP

litgpt pretrain \\

&#x20; --config config/pythia-1b.yaml \\

&#x20; --data.data\_dir data/pretrain \\

&#x20; --devices 8 \\

&#x20; --train.max\_tokens 100\_000\_000\_000

```



\*\*Step 4: Launch pretraining\*\*



For large-scale pretraining on cluster:



```bash

\# Using SLURM

sbatch --nodes=8 --gpus-per-node=8 \\

&#x20; pretrain\_script.sh



\# pretrain\_script.sh content:

litgpt pretrain \\

&#x20; --config config/pythia-1b.yaml \\

&#x20; --data.data\_dir /shared/data/pretrain \\

&#x20; --devices 8 \\

&#x20; --num\_nodes 8 \\

&#x20; --train.global\_batch\_size 512 \\

&#x20; --train.max\_tokens 300\_000\_000\_000

```



\### Workflow 4: Convert and deploy model



Export LitGPT models for production.



```

Model Deployment:

\- \[ ] Step 1: Test inference locally

\- \[ ] Step 2: Quantize model (optional)

\- \[ ] Step 3: Convert to GGUF (for llama.cpp)

\- \[ ] Step 4: Deploy with API

```



\*\*Step 1: Test inference locally\*\*



```python

from litgpt import LLM



llm = LLM.load("out/phi2-lora/final")



\# Single generation

print(llm.generate("What is machine learning?"))



\# Streaming

for token in llm.generate("Explain quantum computing", stream=True):

&#x20;   print(token, end="", flush=True)



\# Batch inference

prompts = \["Hello", "Goodbye", "Thank you"]

results = \[llm.generate(p) for p in prompts]

```



\*\*Step 2: Quantize model\*\* (optional)



Reduce model size with minimal quality loss:



```bash

\# 8-bit quantization (50% size reduction)

litgpt convert\_lit\_checkpoint \\

&#x20; out/phi2-lora/final \\

&#x20; --dtype bfloat16 \\

&#x20; --quantize bnb.nf4



\# 4-bit quantization (75% size reduction)

litgpt convert\_lit\_checkpoint \\

&#x20; out/phi2-lora/final \\

&#x20; --quantize bnb.nf4-dq  # Double quantization

```



\*\*Step 3: Convert to GGUF\*\* (for llama.cpp)



```bash

python scripts/convert\_lit\_checkpoint.py \\

&#x20; --checkpoint\_path out/phi2-lora/final \\

&#x20; --output\_path models/phi2.gguf \\

&#x20; --model\_name microsoft/phi-2

```



\*\*Step 4: Deploy with API\*\*



```python

from fastapi import FastAPI

from litgpt import LLM



app = FastAPI()

llm = LLM.load("out/phi2-lora/final")



@app.post("/generate")

def generate(prompt: str, max\_tokens: int = 100):

&#x20;   result = llm.generate(

&#x20;       prompt,

&#x20;       max\_new\_tokens=max\_tokens,

&#x20;       temperature=0.7

&#x20;   )

&#x20;   return {"response": result}



\# Run: uvicorn api:app --host 0.0.0.0 --port 8000

```



\## When to use vs alternatives



\*\*Use LitGPT when:\*\*

\- Want to understand LLM architectures (clean, readable code)

\- Need production-ready training recipes

\- Educational purposes or research

\- Prototyping new model ideas

\- Lightning ecosystem user



\*\*Use alternatives instead:\*\*

\- \*\*Axolotl/TRL\*\*: More fine-tuning features, YAML configs

\- \*\*Megatron-Core\*\*: Maximum performance for >70B models

\- \*\*HuggingFace Transformers\*\*: Broadest model support

\- \*\*vLLM\*\*: Inference-only (no training)



\## Common issues



\*\*Issue: Out of memory during fine-tuning\*\*



Use LoRA instead of full fine-tuning:

```bash

\# Instead of litgpt finetune (requires 40GB+)

litgpt finetune\_lora  # Only needs 12-16GB

```



Or enable gradient checkpointing:

```bash

litgpt finetune\_lora \\

&#x20; ... \\

&#x20; --train.gradient\_accumulation\_iters 4  # Accumulate gradients

```



\*\*Issue: Training too slow\*\*



Enable Flash Attention (built-in, automatic on compatible hardware):

```python

\# Already enabled by default on Ampere+ GPUs (A100, RTX 30/40 series)

\# No configuration needed

```



Use smaller micro-batch and accumulate:

```bash

\--train.micro\_batch\_size 1 \\

\--train.global\_batch\_size 32 \\

\--train.gradient\_accumulation\_iters 32  # Effective batch=32

```



\*\*Issue: Model not loading\*\*



Check model name:

```bash

\# List all available models

litgpt download list



\# Download if not exists

litgpt download meta-llama/Meta-Llama-3-8B

```



Verify checkpoints directory:

```bash

ls checkpoints/

\# Should see: meta-llama/Meta-Llama-3-8B/

```



\*\*Issue: LoRA adapters too large\*\*



Reduce LoRA rank:

```bash

\--lora\_r 8  # Instead of 16 or 32

```



Apply LoRA to fewer layers:

```bash

\--lora\_query true \\

\--lora\_value true \\

\--lora\_projection false \\  # Disable this

\--lora\_mlp false  # And this

```



\## Advanced topics



\*\*Supported architectures\*\*: See \[references/supported-models.md](references/supported-models.md) for complete list of 20+ model families with sizes and capabilities.



\*\*Training recipes\*\*: See \[references/training-recipes.md](references/training-recipes.md) for proven hyperparameter configurations for pretraining and fine-tuning.



\*\*FSDP configuration\*\*: See \[references/distributed-training.md](references/distributed-training.md) for multi-GPU training with Fully Sharded Data Parallel.



\*\*Custom architectures\*\*: See \[references/custom-models.md](references/custom-models.md) for implementing new model architectures in LitGPT style.



\## Hardware requirements



\- \*\*GPU\*\*: NVIDIA (CUDA 11.8+), AMD (ROCm), Apple Silicon (MPS)

\- \*\*Memory\*\*:

&#x20; - Inference (Phi-2): 6GB

&#x20; - LoRA fine-tuning (7B): 16GB

&#x20; - Full fine-tuning (7B): 40GB+

&#x20; - Pretraining (1B): 24GB

\- \*\*Storage\*\*: 5-50GB per model (depending on size)



\## Resources



\- GitHub: https://github.com/Lightning-AI/litgpt

\- Docs: https://lightning.ai/docs/litgpt

\- Tutorials: https://lightning.ai/docs/litgpt/tutorials

\- Model zoo: 20+ pretrained architectures (Llama, Gemma, Phi, Qwen, Mistral, Mixtral, Falcon, etc.)







