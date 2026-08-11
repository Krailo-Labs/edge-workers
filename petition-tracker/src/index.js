export default {
  async scheduled(event, env, ctx) {
    try {
      const currentCount = await fetchPetitionCount();
      console.log("Отримана кількість підписів:", currentCount);
      if (typeof currentCount !== "number") return;

      // Беремо об'єкт стейту з KV
      const stateStr = await env.PETITION_KV.get("petition_state");
      const now = Date.now();

      if (!stateStr) {
        // Перший запуск: зберігаємо поточний стан (число + час) і виходимо
        await env.PETITION_KV.put("petition_state", JSON.stringify({ 
          count: currentCount, 
          timestamp: now 
        }));
        return;
      }

      const state = JSON.parse(stateStr);
      const diff = currentCount - state.count;

      if (diff >= 0) {
        // Вираховуємо, скільки реально хвилин пройшло з минулого алерту
        const minutesPassed = Math.round((now - state.timestamp) / 60000) || 1;

        await sendTelegramAlert(env, currentCount, diff, minutesPassed);
        
        // Оновлюємо стейт після відправки
        await env.PETITION_KV.put("petition_state", JSON.stringify({ 
          count: currentCount, 
          timestamp: now 
        }));
      }
    } catch (error) {
      console.error("Scheduled worker execution failed:", error.message);
    }
  }
};

async function fetchPetitionCount() {
  const apiUrl = "https://petition.kmu.gov.ua/api/petitions/10515";
  const res = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (KrailoLabs-EdgeWorker/1.0)",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Petition API request failed with status: ${res.status}`);
  }

  const data = await res.json();
  return typeof data.signaturesNumber === "number" ? data.signaturesNumber : null;
}

async function sendTelegramAlert(env, currentCount, diff, minutesPassed) {
  const criticalEmoji = getCriticalityEmoji(currentCount);
  const fleeEmoji = "🧳🏃‍♂️💨";
  
  // Тепер текст повністю динамічний і показує реальний час
  const messageText = `${criticalEmoji} ${fleeEmoji}\n\nПідписів зібрано: ${currentCount} (+${diff} за останні ${minutesPassed} хв)`;

  const tgUrl = `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`;
  const response = await fetch(tgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text: messageText
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Telegram API send failed: ${errText}`);
  }
}

function getCriticalityEmoji(count) {
  if (count >= 15000) return "🚨🚨🚨 🛫🇺🇦 (SOS)";
  if (count >= 10000) return "🔴🔴🔴 (ВИСОКИЙ КРІТІКАЛ)";
  if (count >= 5000) return "🟠🟠 (ОЧКО ПІДЖИМАЄ)";
  if (count >= 1000) return "🟡 (СПАКУХА)";
  if (count >= 500) {
    const extraLevels = Math.floor((count - 500) / 100) + 1;
    return "⚪".repeat(Math.min(extraLevels, 5));
  }
  return "🟢 (СПОКІЙНО)";
}
