package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/smtp"
	// "os"
	"sync"
)

type Response struct {
	Msg   string `json:"msg"`
	Error string `json:"error"`
}

type ContactRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Message   string `json:"msg"`
}

type Singleton struct {
	auth smtp.Auth
}

var lock = &sync.Mutex{}
var auth *Singleton

var server_port = "0.0.0.0:80"

// var username = os.Getenv("EMAIL_USERNAME")
// var password = os.Getenv("EMAIL_PASSWORD")

var username = "check"
var password = "check"
var host = "smtp.gmail.com"
var port = "587"

func getAuth() *Singleton {
	if auth == nil {
		lock.Lock()
		defer lock.Unlock()
		if auth == nil {
			auth = &Singleton{
				auth: smtp.PlainAuth("", username, password, host),
			}
		}
	}
	return auth
}

func sendEmail(r ContactRequest) {
	to := []string{username}
	text := "First name: " + r.FirstName + "\nLast name: " + r.LastName + "\nMessage: " + r.Message

	msg := []byte("To: " + username + "\r\n" +
		"From: " + r.Email + "\r\n" +
		"Subject: Portfolio Contact\r\n" +
		"\r\n" + text + "\r\n")

	err := smtp.SendMail(host+":"+port, getAuth().auth, r.Email, to, msg)
	if err != nil {
		log.Println("ERROR: Failed to send email", err)
	}
}

func contactHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/contact" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	var c ContactRequest

	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		msg := Response{
			Msg:   "ERROR: failed to parse the form",
			Error: err.Error(),
		}

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(msg)
		return
	}

	log.Printf("INFO: sending email: %+v\n", c)
	//sendEmail(c)

	msg := Response{
		Msg:   "INFO: post request successful",
		Error: "",
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}

func main() {
	file_server := http.FileServer(http.Dir("./static"))

	http.Handle("/", file_server)
	http.HandleFunc("/contact", contactHandler)

	log.Println("INFO: Starting server at", server_port)
	if err := http.ListenAndServe(server_port, nil); err != nil {
		log.Fatalln(err)
	}
}
