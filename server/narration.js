// Authenticated ElevenLabs narration adapter. Never falls back to browser voices.
export async function narration(text){
 if(!process.env.LEARNING_VOICE_KEY)return{status:503,error:'Natural narration requires LEARNING_VOICE_KEY in secure environment settings.'};
 if(typeof text!=='string'||text.trim().length<2||text.length>5000)return{status:400,error:'Narration text must contain 2–5000 characters.'};
 const voice=process.env.LEARNING_VOICE_ID;
 if(!voice||!/^[a-zA-Z0-9_-]{5,100}$/.test(voice))return{status:503,error:'Select an ElevenLabs voice using LEARNING_VOICE_ID.'};
 const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`,{method:'POST',headers:{'xi-api-key':process.env.LEARNING_VOICE_KEY,'Content-Type':'application/json',Accept:'audio/mpeg'},signal:AbortSignal.timeout(60000),body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:.45,similarity_boost:.75}})});
 if(!r.ok)return{status:502,error:'The voice provider could not generate narration. Check voice access and credits.'};return{status:200,audio:Buffer.from(await r.arrayBuffer())};
}
