import os
import json
from typing import Dict, Any, List, Optional
from app.core.config import settings

SYSTEM_INSTRUCTION = """You are RetailVision AI, the retail operations copilot for RetailVision 360.
You help retail store managers and associates understand shelf audits, planogram deviations, inventory records, priorities, tasks, verification outcomes, checkout discrepancies, and store analytics.

Core Operating Principles:
1. Grounding: Answer using the application records and calculated metrics supplied in the context from the backend SQLite database.
2. Differentiate Data Sources: Distinguish direct model observations, verified database records, computed metrics, manual associate corrections, and simulated demo data.
3. No Fabrication: Do not fabricate product identities, counts, dates, prices, audit codes, task IDs, inventory levels, metrics, or alert statuses.
4. Transparency: When explaining a recommendation, show the relevant observations, configured rule, threshold, inventory context, and priority score components.
5. Missing Data: When data is missing, uncertain, or outdated, explicitly say so.
6. Honest Discrepancies: Do not describe a checkout discrepancy as proof of theft; frame it as an operational reconciliation variance requiring human review.
7. Verification Integrity: Do not claim that a task is resolved unless the saved status and optical verification evidence support that statement.
8. Safety: Never execute or generate arbitrary SQL queries or shell commands. State changes must happen only via authorized backend services.

When helpful, you may append a JSON action suggestion block at the very end of your response in the format:
<<<ACTION:{"action_type": "NAVIGATE", "target": "/tasks", "label": "View Tasks"}>>>
Supported targets: /dashboard, /shelf-audit, /planograms, /products, /inventory, /product-recognition, /shelf-to-action, /priority-queue, /evidence, /checkout, /store-analytics, /alerts, /audit-history, /reports, /settings.
"""

class GeminiCopilotService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key and len(self.api_key.strip()) > 10:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key.strip())
            except Exception as e:
                print(f"[GeminiCopilotService] Failed to initialize client: {e}")
                self.client = None

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def generate_chat_response(
        self,
        user_message: str,
        context_data: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Executes genuine Gemini API call grounded on backend application database context.
        """
        if not self.is_available():
            # If API key is not provided, return an honest grounded message
            return {
                "content": (
                    "**RetailVision Copilot Offline (Gemini API Key Required)**\n\n"
                    "I am currently operating in read-only local mode because a Gemini API key is not configured in `.env`. "
                    "However, based on live database records:\n"
                    f"- Total Audits: {context_data.get('dashboard', {}).get('total_shelf_audits', 0)}\n"
                    f"- Open Tasks: {context_data.get('dashboard', {}).get('open_operational_tasks', 0)}\n"
                    f"- Active Alerts: {context_data.get('dashboard', {}).get('active_alerts', 0)}\n\n"
                    "To enable full natural language conversational intelligence, configure `GEMINI_API_KEY` in `backend/.env` and restart."
                ),
                "action_metadata": {"action_type": "NAVIGATE", "target": "/settings", "label": "Configure API Key"}
            }

        try:
            # Build bounded context
            context_summary = json.dumps(context_data, indent=2, default=str)
            full_prompt = (
                f"### CURRENT APPLICATION DATABASE CONTEXT ###\n"
                f"{context_summary}\n\n"
                f"### CONVERSATION HISTORY ###\n"
            )

            if conversation_history:
                for msg in conversation_history[-6:]:  # Bounded to recent 6 turns
                    role = "User" if msg.get("sender") == "user" else "Assistant"
                    full_prompt += f"{role}: {msg.get('content')}\n"

            full_prompt += f"\nUser Question: {user_message}\n\nPlease respond based strictly on the above application context:"

            # Call official Gemini SDK
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "temperature": 0.2,  # Low temperature for factual precision
                }
            )

            response_text = response.text or "No response generated by model."

            # Extract structured action if present
            action_metadata = None
            if "<<<ACTION:" in response_text and ">>>" in response_text:
                parts = response_text.split("<<<ACTION:")
                clean_text = parts[0].strip()
                action_part = parts[1].split(">>>")[0].strip()
                try:
                    action_metadata = json.loads(action_part)
                    response_text = clean_text
                except Exception:
                    pass

            return {
                "content": response_text,
                "action_metadata": action_metadata
            }

        except Exception as e:
            print(f"[GeminiCopilotService] Error during inference: {e}")
            return {
                "content": f"**Gemini Copilot Error**: {str(e)}. The underlying operational dashboard and CV workflows remain fully functional.",
                "action_metadata": None
            }

gemini_copilot = GeminiCopilotService()
