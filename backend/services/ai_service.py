import logging
from typing import Optional
from backend.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

def generate_rule_based_remarks(name: str, age: int, glucose: float, haemoglobin: float, cholesterol: float) -> str:
    """
    Deterministic clinical rule engine that generates structured, professional
    health remarks when the Groq API key is missing or unavailable.
    """
    observations = []
    recommendations = []

    # Fasting Blood Glucose
    if glucose < 70:
        observations.append(f"• Glucose ({glucose} mg/dL): Hypoglycemia alert. Below normal fasting range (<70 mg/dL).")
        recommendations.append("Consume fast-acting carbohydrates if symptomatic; discuss glycemic stabilization with a physician.")
    elif glucose <= 99:
        observations.append(f"• Glucose ({glucose} mg/dL): Optimal fasting blood sugar (70-99 mg/dL).")
    elif glucose <= 125:
        observations.append(f"• Glucose ({glucose} mg/dL): Impaired fasting glucose / Prediabetes range (100-125 mg/dL).")
        recommendations.append("Adopt a low-glycemic, fiber-rich diet and engage in 150 minutes of weekly moderate aerobic activity.")
    else:
        observations.append(f"• Glucose ({glucose} mg/dL): Significantly elevated fasting glucose (≥126 mg/dL; diabetic threshold).")
        recommendations.append("Schedule a comprehensive HbA1c test and clinical endocrine consultation promptly.")

    # Haemoglobin
    if haemoglobin < 10.0:
        observations.append(f"• Haemoglobin ({haemoglobin} g/dL): Moderate-to-severe anemia indicator (<10.0 g/dL).")
        recommendations.append("Evaluate serum ferritin, transferrin saturation, and investigate potential nutritional or blood loss causes.")
    elif haemoglobin < 12.0:
        observations.append(f"• Haemoglobin ({haemoglobin} g/dL): Mildly low haemoglobin (<12.0 g/dL). Possible mild iron deficiency.")
        recommendations.append("Increase dietary intake of iron-rich foods (leafy greens, legumes, lean proteins) paired with Vitamin C.")
    elif haemoglobin <= 17.5:
        observations.append(f"• Haemoglobin ({haemoglobin} g/dL): Normal physiological range (12.0-17.5 g/dL).")
    else:
        observations.append(f"• Haemoglobin ({haemoglobin} g/dL): Elevated haemoglobin (>17.5 g/dL). Potential polycythemia or dehydration.")
        recommendations.append("Maintain optimal daily hydration; consult a healthcare provider if persistent.")

    # Cholesterol
    if cholesterol < 200:
        observations.append(f"• Total Cholesterol ({cholesterol} mg/dL): Desirable lipid profile (<200 mg/dL).")
    elif cholesterol <= 239:
        observations.append(f"• Total Cholesterol ({cholesterol} mg/dL): Borderline elevated (200-239 mg/dL).")
        recommendations.append("Limit saturated and trans fats; increase soluble fiber and omega-3 fatty acids.")
    else:
        observations.append(f"• Total Cholesterol ({cholesterol} mg/dL): High risk hypercholesterolemia (≥240 mg/dL).")
        recommendations.append("Full fasting lipid panel (LDL, HDL, Triglycerides) and cardiovascular risk assessment recommended.")

    # Overall Summary
    is_critical = glucose >= 126 or cholesterol >= 240 or haemoglobin < 10.0 or haemoglobin > 18.0
    is_warning = (100 <= glucose <= 125) or (200 <= cholesterol <= 239) or (10.0 <= haemoglobin < 12.0)

    if is_critical:
        summary_verdict = "Priority clinical follow-up is recommended due to out-of-range metabolic/hematologic indicators."
    elif is_warning:
        summary_verdict = "Mild/borderline deviations observed. Proactive lifestyle modifications are recommended."
    else:
        summary_verdict = "All evaluated parameters fall within optimal standard clinical reference intervals."

    rec_text = " ".join(recommendations) if recommendations else "Continue regular wellness screenings and balanced lifestyle habits."

    return (
        f"**Health Summary for {name} (Age {age}):**\n\n"
        f"**Biomarker Analysis:**\n" + "\n".join(observations) + "\n\n"
        f"**Assessment:** {summary_verdict}\n\n"
        f"**Actionable Advice:** {rec_text}\n\n"
        f"_Disclaimer: This is an automated informational assessment for evaluation purposes and does not substitute professional medical diagnosis._"
    )


async def generate_health_remarks(
    name: str,
    age: int,
    glucose: float,
    haemoglobin: float,
    cholesterol: float
) -> str:
    """
    Uses the official Groq Python SDK to generate clinical health remarks
    evaluating blood test values. Falls back seamlessly to rule-based engine
    if credentials are not configured or request fails.
    """
    if not GROQ_API_KEY or not GROQ_API_KEY.strip():
        logger.info("Groq API key not set in environment. Using clinical rule engine fallback.")
        return generate_rule_based_remarks(name, age, glucose, haemoglobin, cholesterol)

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY.strip())

        system_prompt = (
            "You are an expert clinical laboratory medicine AI assistant analyzing a patient's routine blood test panel. "
            "Your task is to provide a concise, structured, professional health remark assessment based on standard reference ranges:\n"
            "- Fasting Blood Glucose (Normal: 70-99 mg/dL, Prediabetes: 100-125 mg/dL, Diabetes: >=126 mg/dL, Low: <70 mg/dL)\n"
            "- Haemoglobin (Normal: 12.0-17.5 g/dL, Low/Anemia: <12.0 g/dL, Severe: <10.0 g/dL, High: >17.5 g/dL)\n"
            "- Total Cholesterol (Desirable: <200 mg/dL, Borderline: 200-239 mg/dL, High: >=240 mg/dL)\n\n"
            "Format your response cleanly in Markdown with these exact sections:\n"
            "**Patient Summary:** Brief 1-line overview of patient and overall metabolic status.\n"
            "**Biomarker Evaluation:** Bullet points analyzing Glucose, Haemoglobin, and Cholesterol with reference to normal ranges.\n"
            "**Clinical Impression & Risk Level:** (State clearly: Normal, Moderate Risk, or High Risk)\n"
            "**Recommendations:** 2-3 specific, evidence-based lifestyle, dietary, or clinical follow-up recommendations.\n"
            "**Medical Disclaimer:** Informational notice that this is not medical advice.\n"
            "Keep the tone objective, encouraging, and medically precise (under 180 words)."
        )

        user_content = (
            f"Patient Name: {name}\n"
            f"Age: {age}\n"
            f"Fasting Blood Glucose: {glucose} mg/dL\n"
            f"Haemoglobin: {haemoglobin} g/dL\n"
            f"Total Cholesterol: {cholesterol} mg/dL\n\n"
            f"Please generate the health remark analysis."
        )

        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            model=GROQ_MODEL,
            temperature=0.2,
            max_tokens=450,
        )

        remarks = chat_completion.choices[0].message.content
        if remarks and remarks.strip():
            return remarks.strip()
        else:
            return generate_rule_based_remarks(name, age, glucose, haemoglobin, cholesterol)

    except Exception as e:
        logger.warning(f"Groq API call error: {e}. Falling back to clinical rule engine.")
        fallback = generate_rule_based_remarks(name, age, glucose, haemoglobin, cholesterol)
        return f"{fallback}\n\n*(Note: Groq AI service unavailable [{type(e).__name__}]; fallback clinical remarks displayed.)*"
