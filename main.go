package main

import (
	"encoding/json"
	"log"
	"net/http"
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

	log.Printf("INFO: request = %+v\n", c)

	msg := Response{
		Msg:   "INFO: post request successful",
		Error: "",
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}

func main() {
	port := "0.0.0.0:80"

	file_server := http.FileServer(http.Dir("./static"))

	http.Handle("/", file_server)
	http.HandleFunc("/contact", contactHandler)

	log.Println("INFO: Starting server at port", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalln(err)
	}
}
