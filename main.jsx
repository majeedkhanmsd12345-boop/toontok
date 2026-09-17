import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const API=(import.meta.env.VITE_API_URL||"").replace(/\/$/,"");
const token=()=>localStorage.getItem("toontok_token");
async function api(path,opts={}) {
  const headers={"content-type":"application/json",...(opts.headers||{})};
  if(token()) headers.authorization=`Bearer ${token()}`;
  const r=await fetch(`${API}${path}`,{...opts,headers});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||"Request failed");
  return d;
}

function Auth({onLogin}) {
  const [mode,setMode]=useState("login"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[username,setUsername]=useState(""),[display,setDisplay]=useState(""),[err,setErr]=useState("");
  async function submit(e){
    e.preventDefault();setErr("");
    try{
      if(mode==="register") await api("/api/auth/register",{method:"POST",body:JSON.stringify({email,password,username,displayName:display||username})});
      const d=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});
      localStorage.setItem("toontok_token",d.token);onLogin(d.user);
    }catch(x){setErr(x.message)}
  }
  return <div className="auth"><div className="brand">▶ ToonTok</div><h1>{mode==="login"?"Welcome back":"Create account"}</h1>
    <form onSubmit={submit}>
      {mode==="register"&&<><input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/><input placeholder="Display name" value={display} onChange={e=>setDisplay(e.target.value)}/></>}
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)} required/>
      {err&&<p className="error">{err}</p>}<button>{mode==="login"?"Log in":"Sign up"}</button>
    </form><button className="ghost" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Create a new account":"I already have an account"}</button>
  </div>
}

function Feed({user}) {
  const [videos,setVideos]=useState([]),[msg,setMsg]=useState("");
  useEffect(()=>{api("/api/feed").then(setVideos).catch(e=>setMsg(e.message))},[]);
  async function like(id){try{await api(`/api/videos/${id}/like`,{method:"POST"});setVideos(v=>v.map(x=>x.id===id?{...x,likes:x.likes+1}:x))}catch(e){setMsg(e.message)}}
  return <main className="feed">{msg&&<div className="toast">{msg}</div>}{videos.map(v=><article className="videoCard" key={v.id}>
    <div className="videoBox" onClick={()=>api(`/api/videos/${v.id}/view`,{method:"POST"})}>
      <iframe title={v.title} src={`https://iframe.videodelivery.net/${v.stream_uid}?autoplay=false&muted=false`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen/>
      <div className="actions"><button onClick={()=>like(v.id)}>♥<small>{v.likes}</small></button><span>💬</span><span>↗</span></div>
    </div>
    <div className="caption"><b>@{v.username}</b><div>{v.title}</div><p>{v.description}</p><small>👁 {v.views} views</small></div>
  </article>)}</main>
}

function Upload() {
  const [file,setFile]=useState(null),[title,setTitle]=useState(""),[desc,setDesc]=useState(""),[status,setStatus]=useState("");
  async function upload(){
    if(!file||!title) return setStatus("Choose a video and add a title.");
    try{
      setStatus("Creating secure upload...");
      const u=await api("/api/upload-url",{method:"POST"});
      setStatus("Uploading video...");
      const fd=new FormData();fd.append("file",file);
      const r=await fetch(u.uploadURL,{method:"POST",body:fd});
      if(!r.ok) throw new Error("Cloudflare Stream upload failed");
      setStatus("Saving video...");
      await api("/api/videos",{method:"POST",body:JSON.stringify({streamUid:u.uid,title,description:desc})});
      setStatus("Posted successfully 🎉");setFile(null);setTitle("");setDesc("");
    }catch(e){setStatus=e.message}
  }
  return <main className="page"><h1>Upload Video ✨</h1><div className="upload"><label className="drop">🎬<strong>{file?file.name:"Choose MP4/MOV video"}</strong><input type="file" accept="video/mp4,video/quicktime" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>Keep videos up to 60 seconds</small></label>
    <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/><textarea placeholder="Description & hashtags" value={desc} onChange={e=>setDesc(e.target.value)}/><button onClick={upload}>Post to ToonTok 🚀</button>{status&&<p>{status}</p>}</div></main>
}

function Profile({user}) {return <main className="page profile"><div className="avatar">{(user.displayName||"T")[0]}</div><h1>{user.displayName}</h1><p>@{user.username}</p><p>{user.bio||"ToonTok creator ✨"}</p><div className="stats"><b>Videos<small>0</small></b><b>Followers<small>0</small></b><b>Following<small>0</small></b></div></main>}

function Admin({user}) {
  const [rows,setRows]=useState([]),[err,setErr]=useState("");
  useEffect(()=>{api("/api/admin/withdrawals").then(setRows).catch(e=>setErr(e.message))},[]);
  async function change(id,status){await api(`/api/admin/withdrawals/${id}`,{method:"PUT",body:JSON.stringify({status})});setRows(r=>r.map(x=>x.id===id?{...x,status}:x))}
  return <main className="page"><h1>Admin Dashboard</h1>{err&&<p className="error">{err}</p>}<div className="adminGrid"><div className="adminCard"><b>Withdrawal requests</b><strong>{rows.filter(x=>x.status==="pending").length}</strong></div></div>{rows.map(w=><div className="withdraw" key={w.id}><div><b>{w.username}</b><p>{w.email}</p><small>{w.method} · {w.account_number}</small></div><strong>Rs {(w.amount_cents/100).toFixed(2)}</strong>{w.status==="pending"&&<><button onClick={()=>change(w.id,"approved")}>Approve</button><button className="danger" onClick={()=>change(w.id,"rejected")}>Reject</button></>}</div>)}</main>
}

function App(){
  const [user,setUser]=useState(null),[tab,setTab]=useState("home");
  useEffect(()=>{if(token())api("/api/me").then(setUser).catch(()=>localStorage.removeItem("toontok_token"))},[]);
  if(!user)return <Auth onLogin={setUser}/>;
  return <div className="app"><header><div className="brand">▶ ToonTok</div><button className="logout" onClick={()=>{localStorage.removeItem("toontok_token");location.reload()}}>Log out</button></header>
    {tab==="home"&&<Feed user={user}/>} {tab==="upload"&&<Upload/>} {tab==="profile"&&<Profile user={user}/>} {tab==="admin"&&user.role==="admin"&&<Admin user={user}/>}
    <nav><button onClick={()=>setTab("home")}>⌂<small>Home</small></button><button onClick={()=>setTab("home")}>⌕<small>Discover</small></button><button className="plus" onClick={()=>setTab("upload")}>+</button><button onClick={()=>setTab("profile")}>♙<small>Profile</small></button>{user.role==="admin"&&<button onClick={()=>setTab("admin")}>⚙<small>Admin</small></button>}</nav>
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);
