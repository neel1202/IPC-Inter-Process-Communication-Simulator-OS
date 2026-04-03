# OS IPC Synchronization Simulator

An interactive web-based simulator for three classic Operating System process synchronization problems. Each problem is visualized step-by-step with real-time semaphore tracking, signal wake-up call animations, and innovative analytical features.

---

## 🗂️ Project Structure

```
OS INNOVATIVE - Copy final/
├── index.html    — Application layout and all UI panels
├── style.css     — Styling, animations, and responsive layout
├── script.js     — Simulation logic for all three problems
└── README.md     — This file
```

---

## 🚀 How to Run

Open `index.html` directly in any modern browser (Chrome, Firefox, Edge). No server or build step required.

---

## 📘 Problems Simulated

### 1. Producer-Consumer (Bounded Buffer)

**Concept:** A producer generates items and places them into a shared bounded buffer. A consumer removes and consumes items. Semaphores coordinate access to prevent race conditions and buffer overflow/underflow.

**Semaphores Used:**
| Semaphore | Initial Value | Purpose |
|-----------|--------------|---------|
| `mutex`   | 1            | Mutual exclusion on buffer access |
| `empty`   | N (buffer size) | Tracks empty slots |
| `full`    | 0            | Tracks filled slots |

**Signal Wake-Up System:**
- When the producer calls `signal(full)` → a 🔔 toast notification, directional arrow strip, and log entry fire to visually wake the Consumer
- When the consumer calls `signal(empty)` → same mechanism fires to wake the Producer
- If a process is BLOCKED (buffer full/empty), it enters an animated pulsing state and is automatically unblocked when the other side signals

**How to use:**
1. Click **Produce** — steps through the producer semaphore sequence (`produce_item → wait(empty) → wait(mutex) → add_to_buffer → signal(mutex) → signal(full)`)
2. Click **Consume** — steps through the consumer sequence
3. Try filling the buffer completely, then observe the blocked state and wake-up when you consume
4. Watch the **Signal Wake-Up Log** at the bottom for a timestamped history

---

### 2. Dining Philosophers

**Concept:** Five philosophers sit at a round table. Each needs two chopsticks (left and right) to eat. Poor scheduling can lead to deadlock (all hungry, none eating) or starvation (one philosopher repeatedly denied access).

**Chopstick Semaphores:** `chopstick[0..4]` — each initialized to 1

**Innovative Features:**

| Feature | Description |
|---------|-------------|
| **💀 Deadlock Detector** | When all 5 philosophers are hungry and no one can eat, a red alert banner appears and the table glows red with a pulsing ring |
| **📊 Starvation Meter** | A per-philosopher bar chart tracks how many ticks each has been stuck in the Hungry state. Colour transitions green → orange → red as starvation worsens |
| **🔴 Starvation Warning Toast** | When a philosopher has been hungry ≥ 3 ticks without eating, a warning toast fires |
| **🔔 Neighbour Wake-Up Signal** | When a philosopher finishes eating and calls `signal(chopstick[i])` + `signal(chopstick[(i+1)%5])`, the simulator identifies and announces which neighbours may now be unblocked |
| **📋 State Event Log** | Timestamped log of every state transition: Thinking → Hungry → Eating → Thinking |
| **▶ Auto Mode** | Continuously fires random steps — ideal for provoking deadlock/starvation naturally |

**How to use:**
1. Click **Random Step** to advance a random philosopher's state
2. Click **▶ Auto** to run automatically and watch deadlock build up
3. Observe the starvation bars growing for blocked philosophers
4. When deadlock occurs, the table glows red and the deadlock counter increments

---

### 3. Readers-Writers

**Concept:** Multiple reader threads can access a shared database simultaneously, but a writer requires exclusive access. The challenge is preventing writer starvation while allowing concurrent reads.

**Semaphores Used:**
| Semaphore | Initial Value | Purpose |
|-----------|--------------|---------|
| `mutex`   | 1            | Protects `readcount` variable |
| `wrt`     | 1            | Exclusive access for writers / first-last reader lock |

**Signal Wake-Up System:**
- When the **last reader exits** (`readcount == 0`), it calls `signal(wrt)` → fires a 🔔 purple toast: *"Last reader exited → Writer is now unblocked"*
- When a **writer finishes**, it calls `signal(wrt)` → fires a 🔔 toast announcing the next queued Reader or Writer that is unblocked

**Innovative Features:**

| Feature | Description |
|---------|-------------|
| **🔔 signal(wrt) Wake-Up Log** | Every `signal(wrt)` event is logged with a timestamp and coloured entry — purple for wake-up signals, blue for reads, red for writes |
| **⚠️ Writer Starvation Alert** | If a writer is waiting while readers are active, an orange animated banner appears warning of starvation risk |
| **Writers Waiting Counter** | Real-time count of how many writers are blocked waiting for exclusive access |
| **Database Visual State** | The DB box changes colour and pulses: blue during reads, red (animated pulse) during writes |

**How to use:**
1. Click **Req Read** to queue a reader, then **Req Write** to queue a writer
2. Click **Req Read** multiple times to simulate reader priority — watch the writer starvation warning appear
3. Click **End Read** for each active reader — when the last one exits, observe `signal(wrt)` fire and wake the writer
4. Click **End Write** after a writer finishes — observe `signal(wrt)` waking the next in queue

---

## 🎨 UI Features

- **Step-by-step code highlighting** — the active line in the pseudocode panel is highlighted in yellow as each operation executes
- **Animated semaphore values** — `mutex`, `empty`, `full`, `wrt`, `readcount` update live
- **Speed slider** — control animation speed from slow (educational) to fast (demonstration)
- **Toast notifications** — slide-in banners for every significant synchronization event
- **Timestamped event logs** — scrollable history of all signals, blocks, and state changes
- **Reset** — returns each simulation to its initial state

---

## 🧠 Key Concepts Demonstrated

| Concept | Where It Appears |
|---------|-----------------|
| Semaphore `wait()` / `signal()` | All three problems |
| Mutual Exclusion (`mutex`) | Producer-Consumer, Readers-Writers |
| Deadlock | Dining Philosophers (detector + glow) |
| Starvation | Dining Philosophers (meter), Readers-Writers (writer alert) |
| Signal Wake-Up Calls | All three problems (log + toast) |
| Bounded Buffer | Producer-Consumer |
| Reader-priority scheduling | Readers-Writers |

---

## 🛠️ Technologies Used

- **HTML5** — Semantic structure
- **CSS3** — Animations, transitions, CSS variables, responsive grid
- **Vanilla JavaScript (ES2017+)** — `async/await` for step-by-step simulation, DOM manipulation

---

## 👤 Author

Neel Shah — Operating Systems Innovative Project
