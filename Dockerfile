FROM golang:1.19
RUN ls -la ../root
RUN mkdir /app
ADD ./ /app/
WORKDIR /app 
COPY noxu-credentials/*.json /app/
RUN go build -o main main.go
CMD ["/app/main"]