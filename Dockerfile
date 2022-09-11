FROM golang:1.19
RUN pwd
RUN mkdir /app
ADD ./ /app/
WORKDIR /app 
COPY noxu-credentials/*.json /app/
# show absolute path of the current working directory
RUN go build -o main main.go
CMD ["/app/main"]