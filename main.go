package main

import (
	"encoding/json"
	"github.com/patrickmn/go-cache"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"sync"
	"time"
)

// Singleton variables and struct
var (
	lock = &sync.Mutex{}
	auth *singleton
)

type singleton struct {
	auth smtp.Auth
}

// Contact handler variables and structs
var (
	username = os.Getenv("EMAIL_USERNAME")
	password = os.Getenv("EMAIL_PASSWORD")
	host     = "smtp.gmail.com"
	port     = "587"
)

type contactRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Message   string `json:"msg"`
}

// Project handler variables and structs
var (
	github_api_url = "https://api.github.com/users/Deezzir/repos?sort=pushed&per_page=15"
	project_cache  = cache.New(5*time.Minute, 10*time.Minute)
)

type repository struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	RepoURL     string   `json:"html_url"`
	Language    string   `json:"language"`
	Topics      []string `json:"topics"`
}

var server_port = "0.0.0.0:80"

func getAuth() *singleton {
	if auth == nil {
		lock.Lock()
		defer lock.Unlock()
		if auth == nil {
			auth = &singleton{
				auth: smtp.PlainAuth("", username, password, host),
			}
		}
	}
	return auth
}

func sendEmail(r contactRequest) bool {
	to := []string{username}
	text := "First name: " + r.FirstName + "\nLast name: " + r.LastName + "\nMessage: " + r.Message

	msg := []byte("To: " + username + "\r\n" +
		"From: " + r.Email + "\r\n" +
		"Subject: Portfolio Contact\r\n" +
		"\r\n" + text + "\r\n")

	err := smtp.SendMail(host+":"+port, getAuth().auth, r.Email, to, msg)

	if err != nil {
		log.Println("[ERROR]: Failed to send email\n", err)
	} else {
		log.Println("[INFO]: Email sent successfully")
	}
	return err == nil
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
	var c contactRequest

	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	log.Printf("[INFO]: sending email: %+v\n", c)
	if ok := sendEmail(c); ok {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func projectHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/project" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if projects, ok := fetchProjects(); ok {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(projects)
		return
	} else {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func fetchProjects() ([]repository, bool) {
	var projects []repository

	if ps, ok := project_cache.Get("projects"); ok {
		log.Println("[INFO]: Getting cached projects")
		projects = ps.([]repository)
	} else {
		resp, err := http.Get(github_api_url)

		if err != nil {
			log.Println("[ERROR]: Failed to get projects from GitHubAPI", err)
			return nil, false
		} else {
			defer resp.Body.Close()

			if err := json.NewDecoder(resp.Body).Decode(&projects); err != nil {
				log.Println("[ERROR]: Failed to decode projects from GitHubAPI", err)
				return nil, false
			} else {
				log.Println("[INFO]: Projects from GitHubAPI decoded successfully")
				log.Println("[INFO]: Caching projects from GitHubAPI")
				project_cache.Set("projects", projects, cache.DefaultExpiration)
			}
		}
	}
	return projects, true
}

func main() {
	file_server := http.FileServer(http.Dir("./static"))

	http.Handle("/", file_server)
	http.HandleFunc("/contact", contactHandler)
	http.HandleFunc("/project", projectHandler)

	defer project_cache.Flush()

	if username == "" || password == "" {
		log.Fatal("[ERROR]: Environment variables EMAIL_USERNAME and EMAIL_PASSWORD are not set")
	}

	log.Println("[INFO]: SMTP email at", username)
	log.Println("[INFO]: Starting server at", server_port)
	if err := http.ListenAndServe(server_port, nil); err != nil {
		log.Fatalln(err)
	}
}
