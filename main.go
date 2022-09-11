package main

// ======================================
// Imports
import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/patrickmn/go-cache"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// ======================================
// ======================================
// Singleton variables and struct
var (
	lock      = &sync.Mutex{}
	gmail_srv *singleton
)

type singleton struct {
	srv *gmail.Service
}

// ContactRequest struct for the form fields
type contactRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Message   string `json:"msg"`
}

// ======================================
// ======================================
// Project handler vars and structs
var (
	github_api_url = "https://api.github.com/users/Deezzir/repos?sort=pushed&per_page=15"
	project_cache  = cache.New(5*time.Minute, 10*time.Minute)
)

// Repository struct for github api repos
type repository struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	RepoURL     string   `json:"html_url"`
	Language    string   `json:"language"`
	Topics      []string `json:"topics"`
}

// ======================================
// ======================================
// Gmail API, OAuth2 helper functions
// ======================================

// Retrieve a token, saves the token, then returns the generated client.
func getGmailAPIClient(config *oauth2.Config) *http.Client {
	tokenFile := "token.json"
	token, err := getTokenFile(tokenFile)
	if err != nil {
		token = getTokenFromWeb(config)
		saveTokenFile(tokenFile, token)
	}
	return config.Client(context.Background(), token)
}

// Get the Gmail API config
func getGmailAPIConfig() *oauth2.Config {
	b, err := os.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("[ERROR]: Unable to read credentials file: %v\n", err)
	}
	config, err := google.ConfigFromJSON(b, gmail.GmailSendScope)
	if err != nil {
		log.Fatalf("[ERROR]: Unable to parse credential file to config: %v\n", err)
	}
	return config
}

// Request a token from the web, then returns the retrieved token.
func getTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	log.Printf("[WARNING]: authorization link: \n%v\n", authURL)

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("[ERROR]: Unable to read authorization code: %v", err)
	}

	tok, err := config.Exchange(context.Background(), authCode)
	if err != nil {
		log.Fatalf("[ERROR]: Unable to retrieve token from web: %v", err)
	}
	return tok
}

// Retrieves a token from a local file.
func getTokenFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// Saves a token to a file path.
func saveTokenFile(path string, token *oauth2.Token) {
	log.Printf("[INFO]: Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("[ERROR]: Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

// Function to get the Service for Gmail API in Singleton pattern
func getGmailAPIService() *singleton {
	if gmail_srv == nil {
		lock.Lock()
		defer lock.Unlock()
		if gmail_srv == nil {
			ctx := context.Background()
			client := getGmailAPIClient(getGmailAPIConfig())

			srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
			if err != nil {
				log.Fatalf("[ERROR]: Unable to retrieve Gmail client: %v\n", err)
			}

			gmail_srv = &singleton{srv: srv}
		}
	}
	return gmail_srv
}

// ======================================
// ======================================
// Function to send email using Gmail API
func sendEmail(r contactRequest, srv *gmail.Service) bool {
	// Create the message
	msg := "From: " + r.Email +
		"\nName: " + r.FirstName + " " + r.LastName +
		"\n\n\n" + r.Message

	email_text := "From: " + r.Email + "\r\n" +
		"To: " + "deezzir@gmail.com" + "\r\n" +
		"Subject: Portfolio Contact\r\n\r\n" +
		msg

	email := &gmail.Message{
		Raw: base64.URLEncoding.EncodeToString([]byte(email_text)),
	}

	_, err := srv.Users.Messages.Send("me", email).Do()
	if err != nil {
		log.Println("[ERROR]: Failed to send email\n", err)
	} else {
		log.Println("[INFO]: Email sent successfully")
	}
	return err == nil
}

// ======================================
// ======================================
// Handler for '/contact' route
// Sends an email using the Gmail API, error if failed
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

	log.Printf("[INFO]: Sending email with: %+v\n", c)
	if ok := sendEmail(c, getGmailAPIService().srv); ok {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusInternalServerError)
	}
}

// ======================================
// ======================================
// Handler for '/projects' route
// Sends a list of  GitHub repos to the client, error if failed
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

// ======================================
// ======================================
// Function to fetch projects from Github API and cache them
// Returns a list of repositories and a boolean indicating success
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

// ======================================
// =============== MAIN =================
var server_port = "0.0.0.0:80"

func main() {
	file_server := http.FileServer(http.Dir("./static"))

	http.Handle("/", file_server)
	http.HandleFunc("/contact", contactHandler)
	http.HandleFunc("/project", projectHandler)

	log.Println("[INFO]: Starting server at", server_port)
	if err := http.ListenAndServe(server_port, nil); err != nil {
		log.Fatalln(err)
	}
}
