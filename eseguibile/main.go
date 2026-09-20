// Portolano – avvio locale: serve l'app su http://127.0.0.1:8765 e apre il browser.
package main

import (
	_ "embed"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync/atomic"
	"time"
)

//go:embed index.html
var pagina []byte

//go:embed icon-192.png
var icona []byte

const porta = "8765"

var remoto = "https://portolano-gerax.vercel.app"
var inattivita = "90"

var ultimoPing int64

const battito = `<script>(function(){function p(){fetch("/ping",{cache:"no-store"}).catch(function(){});}p();setInterval(p,5000);})();</script>`

func apri(u string) {
	var c *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		c = exec.Command("rundll32", "url.dll,FileProtocolHandler", u)
	case "darwin":
		c = exec.Command("open", u)
	default:
		c = exec.Command("xdg-open", u)
	}
	_ = c.Start()
}

func main() {
	indirizzo := "127.0.0.1:" + porta
	u := "http://" + indirizzo + "/"
	ln, err := net.Listen("tcp", indirizzo)
	if err != nil {
		// già in esecuzione: apri soltanto il browser
		apri(u)
		return
	}
	target, _ := url.Parse(remoto)
	proxy := httputil.NewSingleHostReverseProxy(target)
	dir := proxy.Director
	proxy.Director = func(r *http.Request) { dir(r); r.Host = target.Host }

	html := pagina
	if i := strings.LastIndex(string(pagina), "</body>"); i >= 0 {
		html = []byte(string(pagina[:i]) + battito + string(pagina[i:]))
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(html)
	})
	mux.HandleFunc("/icon.png", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		w.Write(icona)
	})
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		atomic.StoreInt64(&ultimoPing, time.Now().Unix())
		w.WriteHeader(204)
	})
	mux.Handle("/api/", proxy)

	limite, _ := strconv.ParseInt(inattivita, 10, 64)
	if limite <= 0 {
		limite = 90
	}
	atomic.StoreInt64(&ultimoPing, time.Now().Unix())
	go func() {
		for {
			time.Sleep(2 * time.Second)
			if time.Now().Unix()-atomic.LoadInt64(&ultimoPing) > limite {
				// nessuna scheda aperta da 90 secondi: chiudi
				ln.Close()
				return
			}
		}
	}()
	apri(u)
	fmt.Println("Portolano in esecuzione su", u)
	_ = http.Serve(ln, mux)
}
