package main

// ======================================
// Imports
import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// ======================================
// GMAIL Service vars and structs
// ======================================
var (
	lock     = &sync.Mutex{}
	gmailSrv *singleton
)

// Singleton struct for Gmail API Service
type singleton struct {
	srv *gmail.Service
}

// ======================================
// Contact Handler vars and structs
// ======================================
type contactRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Email     string `json:"email"`
	Message   string `json:"msg"`
}

// ======================================
// Project handler vars and structs
// ======================================
var (
	githubAPI_repos = "https://api.github.com/users/Deezzir/repos?sort=pushed&per_page=15"
	githubAPI_repo  = "https://api.github.com/repos/Deezzir/"
	projectCache    = cache.New(30*time.Minute, 10*time.Minute)
)

// Project struct for github api repos
type project struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	RepoURL     string   `json:"html_url"`
	Topics      []string `json:"topics"`
	Languages   []string `json:"languages"`
}

// ======================================
// ======================================
// Gmail API, OAuth2 helper functions
// ======================================

// Retrieves a token, saves the token, then returns the generated client.
func getGmailAPIClient(config *oauth2.Config) *http.Client {
	tokenFile := "token.json"
	token, err := getTokenFile(tokenFile)
	if err != nil {
		token = getTokenFromWeb(config)
		saveTokenFile(tokenFile, token)
	}
	return config.Client(context.Background(), token)
}

// Get the Gmail API config from the credentials.json file, returns the config
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

// Retrieves a token from a local file, returns the retrieved token, error if no token is found
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
// returns *gmail.Service
func getGmailAPIService() *singleton {
	if gmailSrv == nil {
		lock.Lock()
		defer lock.Unlock()
		if gmailSrv == nil {
			ctx := context.Background()
			client := getGmailAPIClient(getGmailAPIConfig())

			srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
			if err != nil {
				log.Fatalf("[ERROR]: Unable to retrieve Gmail client: %v\n", err)
			}

			gmailSrv = &singleton{srv: srv}
		}
	}
	return gmailSrv
}

// Function to send email using Gmail API
// returns bool if email was sent successfully
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
// Projects Handler Helper Functions
// ======================================

// Function to fetch projects from Github API and cache them
// Returns a list of repositories and a boolean indicating success
func fetchProjects() ([]project, bool) {
	var projects []project

	if ps, ok := projectCache.Get("projects"); ok {
		log.Println("[INFO]: Getting cached projects")
		projects = ps.([]project)
	} else {
		resp, err := http.Get(githubAPI_repos)

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
				if ok := fetchProjectsLangs(projects); !ok {
					log.Println("[ERROR]: Failed to fetch projects languages")
				}
				log.Println("[INFO]: Caching projects from GitHubAPI")

				projectCache.Set("projects", projects, cache.DefaultExpiration)
			}
		}
	}
	return projects, true
}

// Function to fetch projects languages from Github API
// Returns a boolean indicating success
func fetchProjectsLangs(projects []project) bool {
	for i := range projects {
		project := &projects[i]
		resp, err := http.Get(githubAPI_repo + project.Name + "/languages")

		if err != nil {
			log.Println("[ERROR]: Failed to get project languages from GitHubAPI", err)
			return false
		} else {
			defer resp.Body.Close()

			var langs map[string]interface{}

			if err := json.NewDecoder(resp.Body).Decode(&langs); err != nil {
				log.Println("[ERROR]: Failed to decode project languages from GitHubAPI", err)
				return false
			} else {
				var langs_key []string

				for k := range langs {
					langs_key = append(langs_key, k)
				}
				sort.SliceStable(langs_key, func(i, j int) bool {
					return langs[langs_key[i]].(float64) > langs[langs_key[j]].(float64)
				})
				if len(langs_key) > 3 {
					langs_key = langs_key[:3]
				}

				project.Languages = langs_key
			}
		}
	}
	log.Printf("[INFO]: Projects languages decoded successfully\n")
	return true
}

// ======================================
// Routes
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
// Main
// ======================================
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
